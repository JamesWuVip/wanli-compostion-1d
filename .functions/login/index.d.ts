
    interface LoginRequest {
      username: string;
      password: string;
    }

    interface LoginResponse {
      code: number;
      message: string;
      data?: {
        _id?: string;
        username?: string;
        email?: string;
        [key: string]: any;
      };
    }

    interface CloudFunctionEvent {
      username: string;
      password: string;
    }

    export declare function main(event: CloudFunctionEvent, context: any): Promise<LoginResponse>;
  