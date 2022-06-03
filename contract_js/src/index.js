import {
    NearContract,
    NearBindgen,
    call,
    view,
    Vector
} from 'near-sdk-js'
import {
    PostedMessage
} from './model';

// The maximum number of latest messages the contract returns.
const MESSAGE_LIMIT = 10;

@NearBindgen
class Contract extends NearContract {
    constructor() {
        super()
        this.messages = new Vector("m");
    }

    deserialize() {
        super.deserialize()
        this.messages = Object.assign(new Vector(), this.messages)
    }

    /**
     * Adds a new message under the name of the sender's account id.\
     * NOTE: This is a change method. Which means it will modify the state.\
     * But right now we don't distinguish them with annotations yet.
     */
    @call
    addMessage(text) {
        // Creating a new message and populating fields with our data
        const message = new PostedMessage(text);
        // Adding the message to end of the persistent collection
        this.messages.push(message);
    }
  
    /**
     * Returns an array of last N messages.\
     * NOTE: This is a view method. Which means it should NOT modify the state.
     */
    @view
    getMessages() {
        const numMessages = Math.min(MESSAGE_LIMIT, this.messages.length);
        const startIndex = this.messages.length - numMessages;
        const result = new Array(numMessages);
        for(let i = 0; i < numMessages; i++) {
            result[i] = this.messages.get(i + startIndex);
        }
        return result;
    }
}
