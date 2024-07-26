import { Client, LocalStream } from "ion-sdk-js";
import { IonSFUJSONRPCSignal } from "ion-sdk-js/lib/signal/json-rpc-impl";

class IonSfuClient {
  constructor(url) {
    this.signal = new IonSFUJSONRPCSignal(url);
    this.client = new Client(this.signal);

    this.signal.onopen = () => console.log("Signal connection opened");
    this.signal.onclose = () => console.log("Signal connection closed");
    this.signal.onerror = (error) => console.error("Signal error:", error);
  }

  async connect(sessionId, uid) {
    return new Promise((resolve, reject) => {
      this.signal.onopen = async () => {
        try {
          await this.client.join(sessionId, uid);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      this.signal.onerror = (error) => {
        reject(error);
      };
    });
  }

  onTrack(callback) {
    this.client.ontrack = (track, stream) => {
      callback(track, stream);
    };
  }

  async publishStream(streamOrConstraints = { audio: true, video: false }) {
    let localStream;

    if (streamOrConstraints instanceof LocalStream) {
      localStream = streamOrConstraints;
    } else {
      localStream = await LocalStream.getUserMedia(streamOrConstraints);
    }

    await this.client.publish(localStream);
    return localStream;
  }

  async cleanupStream(stream) {
    try {
      await this.unpublishStream(stream);
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    } catch (error) {
      console.error("Error cleaning up stream:", error);
      throw error;
    }
  }

  async unpublishStream(stream) {
    try {
      await this.client.unpublish(stream);
    } catch (error) {
      console.error("Error unpublishing stream:", error);
      throw error;
    }
  }

  close() {
    this.client.close();
    this.signal.close();
  }
}

export default IonSfuClient;
