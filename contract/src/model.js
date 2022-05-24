import { near } from 'near-sdk-js';

export class PostedMessage {
    constructor(text) {
        this.premium = false;
        this.text = text;
        this.sender = near.signerAccountId();
    }

    toString() {
        return JSON.stringify(this)
    }
}
