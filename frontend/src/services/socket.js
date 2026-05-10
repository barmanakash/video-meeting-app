import SockJS from "sockjs-client";
import Stomp from "stompjs";

let stompClient = null;

export const connectSocket = (onConnected) => {
  const socket = new SockJS("http://localhost:8080/ws");

  stompClient = Stomp.over(socket);

  stompClient.connect({}, () => {
    console.log("Connected");
    onConnected();
  });
};

export const sendMessage = (destination, body) => {
  stompClient.send(destination, {}, JSON.stringify(body));
};

export const subscribe = (topic, callback) => {
  stompClient.subscribe(topic, (message) => {
    callback(JSON.parse(message.body));
  });
};
