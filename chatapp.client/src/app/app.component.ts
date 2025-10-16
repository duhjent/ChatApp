import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import * as signalR from "@microsoft/signalr";
import {catchError, Observable, Subject, switchMap} from 'rxjs';
import {map} from 'rxjs/operators'

interface ChatMessage {
  timestamp: Date;
  senderUserName: string;
  targetUserName: string;
  message: string;
}

interface SendMessageRequest {
  targetUserName: string;
  message: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  public userName: string = '';

  public targetUserName?: string;
  public message: string = '';

  public errorMessage?: any;

  private connection?: signalR.HubConnection;
  public isConnected: boolean = false;

  public messagesHistory: ChatMessage[] = [];

  private usersOnline: Subject<string[]> = new Subject<string[]>()
  public usersOnline$: Observable<string[]>;

  constructor(private httpClient: HttpClient) {
    this.usersOnline$ = this.usersOnline
      .pipe(map(usersOnline => usersOnline.filter(userName => userName != this.userName)));
  }

  async ngOnDestroy(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
    }
  }

  ngOnInit() {
  }

  public async connect() {
    this.errorMessage = null;

    if (!this.userName) {
      this.errorMessage = 'Empty user name';
      return;
    }


    this.httpClient
      .post('/api/login', {userName: this.userName})
      .pipe(
        switchMap(_ => {
          this.connection = new signalR
            .HubConnectionBuilder()
            .withUrl('/api/hub',)
            .build();

          this.connection.on('receiveMessage', (message: ChatMessage) => {
            this.messagesHistory.push(message);
          });

          this.connection.on('usersOnline', (usersList) => {
            this.usersOnline.next(usersList);
          })

          return this.connection.start();
        }),
        catchError(err => this.errorMessage = err)
      )
      .subscribe(() => {
        this.isConnected = true;
      });
  }

  public async sendMessage() {
    if (!this.connection) {
      return;
    }

    this.errorMessage = null;

    if (!this.targetUserName || !this.message) {
      return;
    }

    if (this.userName == this.targetUserName) {
      this.errorMessage = 'Cannot send message to yourself';
      return;
    }

    let req= <SendMessageRequest>{targetUserName: this.targetUserName, message: this.message};

    await this.connection.send('newMessage', req);

    this.message = '';
  }

  get currentUserMessages() {
    return this.messagesHistory.filter(x => x.senderUserName == this.targetUserName || x.targetUserName == this.targetUserName);
  }
}
