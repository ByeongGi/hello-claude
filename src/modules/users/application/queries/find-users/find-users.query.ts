import { Query, QueryProps } from '@/libs/ddd';

export class FindUsersQuery extends Query {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;

  constructor(props: QueryProps) {
    super(props);
    this.page = props.page;
    this.limit = props.limit;
    this.search = props.search;
  }
}
