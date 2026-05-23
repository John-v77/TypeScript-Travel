import { Query, Model } from "mongoose";
import { json } from "stream/consumers";

export interface QueryString {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  [key: string]: any;
}

export class APIFeatures<T> {
  query: Query<T[], T>;
  queryString: QueryString;

  constructor(model: Model<T>, queryString: QueryString) {
    this.query = model.find();
    this.queryString = queryString;
  }

  // Filtering
  filter(): this {
    const queryObj: Record<string, any> = { ...this.queryString };
    const excludedFields: string[] = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el: string) => delete queryObj[el]);

    // Advanced filtering
    let queryStr: string = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Apply Additional filters if there are any
    const filterObj = JSON.parse(queryStr);
    if (Object.keys(filterObj).length > 0) {
      this.query = this.query.where(filterObj);
    }

    return this;
    // let query: Query<Tour[], Tour> = TourModel.find(JSON.parse(queryStr));
  }

  //Sorting
  sort(): this {
    if (this.queryString.sort) {
      const sortBy: string = (this.queryString.sort as string)
        .split(",")
        .join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // Field limiting
  limitFields(): this {
    if (this.queryString.fields) {
      const fields: string = (this.queryString.fields as string)
        .split(",")
        .join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  // Pagination
  paginate(): this {
    const page: number = parseInt(this.queryString.page as string) || 1;
    const limitNo: number = parseInt(this.queryString.limit as string) || 20;
    const skipNo: number = (page - 1) * limitNo;

    this.query = this.queryString.skip(skipNo).limit(limitNo);
    return this;
  }
}
