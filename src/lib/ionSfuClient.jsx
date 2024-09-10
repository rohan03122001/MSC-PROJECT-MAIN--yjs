import { Client, LocalStream } from "ion-sdk-js";
import { IonSFUJSONRPCSignal } from "ion-sdk-js/lib/signal/json-rpc-impl";

class IonSfuClient {
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  keepaliveInterval = null;
  streams = new Map();
  onTrackCallbacks = [];

  constructor(url) {
    console.log(`IonSfuClient: Constructor called with URL: ${url}`);
    this.initializeConnection(url);
  }

  initializeConnection(url) {
    console.log(`IonSfuClient: Initializing connection to ${url}`);
    this.signal = new IonSFUJSONRPCSignal(url);
    this.client = new Client(this.signal);

    this.signal.onopen = () => {
      console.log(`IonSfuClient: Signal connection opened to ${url}`);
      console.log(`IonSfuClient: WebSocket readyState: ${this.signal.socket.readyState}`);
      this.reconnectAttempts = 0;
    };

    this.signal.onclose = (event) => {
      console.log(`IonSfuClient: Signal connection closed. Event:`, event);
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`IonSfuClient: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.initializeConnection(url), 5000 * Math.pow(2, this.reconnectAttempts - 1));
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log(`IonSfuClient: Max reconnection attempts reached. Giving up.`);
        this.onConnectionLost && this.onConnectionLost();
      }
    };

    this.signal.onerror = (error) => {
      console.error("IonSfuClient: Signal error:", error);
    };

    this.client.ontrack = (track, stream) => {
      console.log(`IonSfuClient: New track received. Type: ${track.kind}, StreamID: ${stream.id}`);
      this.streams.set(stream.id, stream);
      this.onTrackCallbacks.forEach(callback => callback(track, stream));
    };
  }

  async connect(sessionId, uid) {
    console.log(`IonSfuClient: Connecting to session ${sessionId} with UID ${uid}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error(`IonSfuClient: Connection timeout after 10 seconds`);
        reject(new Error("Connection timeout"));
      }, 10000);

      this.signal.onopen = async () => {
        clearTimeout(timeout);
        console.log(`IonSfuClient: Signal connection opened, joining session ${sessionId}`);
        try {
          await this.client.join(sessionId, uid);
          console.log(`IonSfuClient: Successfully joined session ${sessionId} with UID ${uid}`);
          this.startKeepalive();
          resolve();
        } catch (error) {
          console.error(`IonSfuClient: Error joining session ${sessionId}:`, error);
          reject(error);
        }
      };
    });
  }

  onTrack(callback) {
    console.log("IonSfuClient: Adding onTrack callback");
    this.onTrackCallbacks.push(callback);
    
    this.streams.forEach((stream) => {
      stream.getTracks().forEach((track) => callback(track, stream));
    });
  }

  async publishStream(constraints = { audio: true, video: false }) {
    console.log("IonSfuClient: Publishing stream with constraints:", constraints);
    try {
      const localStream = await LocalStream.getUserMedia(constraints);
      console.log(`IonSfuClient: Local stream obtained. Stream ID: ${localStream.id}`);
      await this.client.publish(localStream);
      console.log(`IonSfuClient: Stream ${localStream.id} published successfully`);
      return localStream;
    } catch (error) {
      console.error("IonSfuClient: Error publishing stream:", error);
      throw error;
    }
  }

  async cleanupStream(stream) {
    console.log(`IonSfuClient: Cleaning up stream ${stream.id}`);
    try {
      await this.unpublishStream(stream);
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log(`IonSfuClient: Stopped track: ${track.kind} for stream ${stream.id}`);
      });
      console.log(`IonSfuClient: Stream ${stream.id} cleaned up successfully`);
    } catch (error) {
      console.error(`IonSfuClient: Error cleaning up stream ${stream.id}:`, error);
      throw error;
    }
  }

  async unpublishStream(stream) {
    console.log(`IonSfuClient: Unpublishing stream ${stream.id}`);
    try {
      await this.client.unpublish(stream);
      console.log(`IonSfuClient: Stream ${stream.id} unpublished successfully`);
    } catch (error) {
      console.error(`IonSfuClient: Error unpublishing stream ${stream.id}:`, error);
      throw error;
    }
  }

  close() {
    console.log("IonSfuClient: Closing client and signal connections");
    this.stopKeepalive();
    try {
      this.client.close();
      this.signal.close();
      console.log("IonSfuClient: Client and signal connections closed successfully");
    } catch (error) {
      console.error("IonSfuClient: Error closing connections:", error);
    }
  }

  setOnConnectionLost(callback) {
    this.onConnectionLost = callback;
  }

  startKeepalive() {
    this.keepaliveInterval = setInterval(() => {
      if (this.signal && this.signal.socket.readyState === WebSocket.OPEN) {
        this.signal.socket.send(JSON.stringify({ method: "keepalive" }));
        console.log("IonSfuClient: Sent keepalive");
      }
    }, 30000);
  }

  stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      console.log("IonSfuClient: Stopped keepalive");
    }
  }
}

export default IonSfuClient;