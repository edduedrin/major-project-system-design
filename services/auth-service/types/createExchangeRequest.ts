export class CreateExchangeRequest {
    constructor(
        public name: string,
        public type: string
    ) {}
}

export interface BrokerResponse {
    status: boolean;
    message: string;
    transactionId: string;
}

export class PublishRequest {
    constructor(
        public exchange: string,
        public payload: any,
        public binding_key: string,
        public type: string
    ) {}
}

export class CustomErrorRabbitMq extends Error {
    constructor(public name: string,public message: string, public status: boolean) {
        super();
    }
}



