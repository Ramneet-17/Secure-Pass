import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credential-form',
  standalone: true,
  templateUrl: './credential-form.html',
  styleUrls: ['./credential-form.css'],
  imports: [CommonModule, FormsModule]
})
export class CredentialFormComponent {
  @Output() onAdd = new EventEmitter<any>();
  site = '';
  username = '';
  password = '';

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.onAdd.emit({ site: this.site, username: this.username, password: this.password });
      this.site = this.username = this.password = '';
      form.resetForm();
    }
  }
}