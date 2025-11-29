import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.css']
})
export class ImportDialogComponent {
  @Output() fileSelected = new EventEmitter<File>();
  @Output() cancelled = new EventEmitter<void>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  selectedFile: File | null = null;

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  confirm(): void {
    if (this.selectedFile) {
      this.fileSelected.emit(this.selectedFile);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

