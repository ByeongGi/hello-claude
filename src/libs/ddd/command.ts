export abstract class Command {
  constructor(props?: any) {
    if (props) {
      Object.assign(this, props);
    }
  }
}

export interface CommandProps {
  [key: string]: any;
}
