var
    answer = {
        type: 'object',
        additionalProperties: false,
        required: ['answer'],
        properties: {
            answer: {
                type: 'string',
                minLength: 1,
                maxLength: 200
            },
            image: {
                type: 'object',
                additionalProperties: false,
                required: ['url'],
                properties: {
                    url: {
                        type: 'string',
                        format: 'uri',
                        minLength: 1
                    }
                }
            }
        }
    },
    question = {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: {
            text: {
                type: 'string',
                minLength: 1,
                maxLength: 500
            },
            image: {
                type: 'object',
                additionalProperties: false,
                required: ['url'],
                properties: {
                    url: {
                        type: 'string',
                        format: 'uri',
                        minLength: 1
                    }
                }
            }
        }
    };

var helper = {
    answer: answer,
    question: question
};