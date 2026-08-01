import { Query, Model } from "mongoose";

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

  constructor(query: Query<T[], T>, queryString: QueryString) {
    this.query = query;
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
    const parsedPage = parseInt(this.queryString.page as string);
    const parsedLimit = parseInt(this.queryString.limit as string);

    const page: number = parsedPage > 0 ? parsedPage : 1;
    const limitNo: number = parsedLimit > 0 ? parsedLimit : 20;
    const skipNo: number = (page - 1) * limitNo;

    this.query = this.query.skip(skipNo).limit(limitNo);
    return this;
  }
}
