import { ClientSession, FilterQuery, Model, ProjectionType, QueryOptions, UpdateQuery, UpdateWriteOpResult } from 'mongoose';

export class BaseRepository<T> {
  constructor(private readonly model: Model<T>) {}

  // Centralized CRUD database operations for all entities, to avoid code duplication.
  // Reads return plain objects (lean) so services never touch Mongoose documents.

  create(doc: Partial<T> | Record<string, unknown>, session?: ClientSession) {
    return this.model.create([doc], { session }).then(([created]) => created.toObject() as T);
  }

  insertMany(docs: Array<Partial<T> | Record<string, unknown>>) {
    return this.model.insertMany(docs, { ordered: true });
  }

  findById(id: string | unknown, projection?: ProjectionType<T>) {
    return this.model.findById(id as any, projection).lean<T>().exec();
  }

  findOne(filter: FilterQuery<T>, projection?: ProjectionType<T>) {
    return this.model.findOne(filter, projection).lean<T>().exec();
  }

  find(filter: FilterQuery<T>, options: { sort?: Record<string, 1 | -1>; limit?: number; projection?: ProjectionType<T> } = {}) {
    let query = this.model.find(filter, options.projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    return query.lean<T[]>().exec();
  }

  findOneAndUpdate(filter: FilterQuery<T>, update: UpdateQuery<T> | any[], options: QueryOptions = {}) {
    return this.model
      .findOneAndUpdate(filter, update as any, { new: true, ...options })
      .lean<T>()
      .exec();
  }

  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateWriteOpResult> {
    return this.model.updateOne(filter, update).exec();
  }

  deleteOne(filter: FilterQuery<T>) {
    return this.model.deleteOne(filter).exec();
  }

  deleteMany(filter: FilterQuery<T> = {}) {
    return this.model.deleteMany(filter).exec();
  }

  countDocuments(filter: FilterQuery<T> = {}) {
    return this.model.countDocuments(filter).exec();
  }

  /** Waits until the indexes declared on the schema (including the unique ones) are built. */
  ensureIndexes() {
    return this.model.init();
  }
}
