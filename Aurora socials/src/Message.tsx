// PascalCasing
console.log('Message module loaded');
function Message() {
    console.log('Message render');
    return <h1>Hello World</h1>;
}

export const MessageNamed = Message;
export default Message;

