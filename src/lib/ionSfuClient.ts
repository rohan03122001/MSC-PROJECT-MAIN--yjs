import { Client, LocalStream, RemoteStream } from "ion-sdk-js";
import { IonSFUJSONRPCSignal } from "ion-sdk-js/lib/signal/json-rpc-impl";

class IonSfuClient {
  private signal: IonSFUJSONRPCSignal;
  private client: Client;

  constructor(url: string) {
    this.signal = new IonSFUJSONRPCSignal(url);
    this.client = new Client(this.signal);

    this.signal.onopen = () => console.log("Signal connection opened");
    this.signal.onclose = () => console.log("Signal connection closed");
    this.signal.onerror = (error) => console.error("Signal error:", error);
  }

  async connect(sessionId: string, uid: string): Promise<void> {
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

  onTrack(callback: (track: MediaStreamTrack, stream: RemoteStream) => void) {
    this.client.ontrack = (track, stream) => {
      callback(track, stream);
    };
  }

  async publishStream(
    constraints: MediaStreamConstraints = { audio: true, video: false }
  ): Promise<LocalStream> {
    const localStream = await LocalStream.getUserMedia(constraints);
    await this.client.publish(localStream);
    return localStream;
  }

  async cleanupStream(stream: LocalStream): Promise<void> {
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

  async unpublishStream(stream: LocalStream): Promise<void> {
    try {
      await this.client.close();
    } catch (error) {
      console.error("Error unpublishing stream:", error);
      throw error;
    }
  }

  close(): void {
    this.client.close();
    this.signal.close();
  }
}

export default IonSfuClient;
