import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as signalR from "@microsoft/signalr";
import { catchError, Observable, switchMap } from 'rxjs';

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

  public messagesHistory: string[] = [];

  constructor(private httpClient: HttpClient) { }

  ngOnDestroy(): void {
    if (this.connection) {
      this.connection.stop();
    }
  }

  ngOnInit() { }

  public async connect() {
    this.errorMessage = null;

    if (!this.userName) {
      this.errorMessage = 'Empty user name';
      return;
    }


    this.httpClient
      .post('/api/login', { userName: this.userName })
      .pipe(
        switchMap(_ => {
          this.connection = new signalR
            .HubConnectionBuilder()
            .withUrl('/api/hub',)
            .build();

          this.connection.on('receiveMessage', (uid, message) => {
            this.messagesHistory.push(`${uid}: ${message}`);
          });

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

    if (this.userName == this.targetUserName) {
      this.errorMessage = 'Cannot send message to yourself';
      return;
    }

    await this.connection.send('newMessage', this.targetUserName, this.message);

    this.message = '';
  }
}
