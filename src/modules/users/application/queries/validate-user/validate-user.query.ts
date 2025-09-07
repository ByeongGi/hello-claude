import { Query, QueryProps } from '@/libs/ddd';

export class ValidateUserQuery extends Query {
  readonly email: string;
  readonly pass: string;

  constructor(props: QueryProps<ValidateUserQuery>) {
    super(props);
    this.email = props.email;
    this.pass = props.pass;
  }
}
