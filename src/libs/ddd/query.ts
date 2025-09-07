export abstract class Query {
  constructor(props?: any) {
    if (props) {
      Object.assign(this, props);
    }
  }
}

export interface QueryProps {
  [key: string]: any;
}
