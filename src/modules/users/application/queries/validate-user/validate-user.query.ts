import { Query, QueryProps } from '@/libs/ddd';

export class ValidateUserQuery extends Query {
  readonly email: string;
  readonly pass: string;

  constructor(props: QueryProps) {
    super(props);
    this.email = props.email;
    this.pass = props.pass;
  }
}
