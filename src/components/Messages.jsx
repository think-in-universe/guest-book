import React from 'react';
import PropTypes from 'prop-types';

export default function Messages({ messages }) {
  return (
    <>
      <h2>Messages</h2>
      {messages.map((message, i) => {
          message = JSON.parse(message);
          // TODO: format as cards, add timestamp
          return <p key={i} className={message.premium ? 'is-premium' : ''}>
            <strong>{message.sender}</strong>:<br/>
            {message.text}
          </p>
        }
      )}
    </>
  );
}

Messages.propTypes = {
  messages: PropTypes.array
};
