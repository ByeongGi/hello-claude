import { Query, QueryProps } from '@/libs/ddd';

export class FindUserByIdQuery extends Query {
  readonly id: string;

  constructor(props: QueryProps) {
    super(props);
    this.id = props.id;
  }
}
