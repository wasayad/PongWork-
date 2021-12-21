import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
 } from '@nestjs/websockets';
 import { Logger } from '@nestjs/common';
 import { Socket, Server } from 'socket.io';
 
 @WebSocketGateway(5001, {transports: ['websocket']})
 export class ChannelGateway implements OnGatewayInit {

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChannelGateway');
 
  @SubscribeMessage('msg_toServer')
  handleMessage(@MessageBody() message: string): void {
   this.server.emit('msg_toClient', message);
  }

  @SubscribeMessage('ReadyUp')
  ReadyUp(@MessageBody() message: string): void {
   this.server.emit('ReadyUp', message);
  }

  @SubscribeMessage('AddPoint')
  AddPoint(@MessageBody() Player: string): void {
   this.server.emit('AddPoint', Player);
  }

  @SubscribeMessage('SetPosition')
  SetPosition(@MessageBody() Position: number, @MessageBody() Player: string): void {
   this.server.emit('SetPosition', Position[0], Position[1]);
  }


  @SubscribeMessage('SetBallPos')
  SetBallPos(@MessageBody() posx: number, @MessageBody() posy:number): void {
   this.server.emit('SetBallPos', posx[0], posy[1]);
  }
  afterInit(server: Server) {
   this.logger.log('Init');
  }
 
  handleDisconnect(@ConnectedSocket() socket: Socket) {
   this.logger.log(`Client disconnected`);
  }
 
  handleConnection(@ConnectedSocket() socket: Socket) {
   this.logger.log(socket.handshake.headers.cookie);
   this.logger.log(`Client connected`);
  }
 }