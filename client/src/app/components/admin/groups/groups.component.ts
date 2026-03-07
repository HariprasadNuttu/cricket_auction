import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-groups',
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})
export class GroupsComponent implements OnInit {
  groups: any[] = [];
  showCreateModal = false;
  showEditModal = false;
  selectedGroup: any = null;
  
  formData = {
    name: '',
    description: ''
  };

  constructor(
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.apiService.getGroups().subscribe({
      next: (data) => {
        this.groups = data.groups || data || [];
      },
      error: (e) => {
        console.error('Failed to load groups:', e);
        alert('Failed to load groups');
      }
    });
  }

  openCreateModal() {
    this.formData = { name: '', description: '' };
    this.showCreateModal = true;
  }

  openEditModal(group: any) {
    this.selectedGroup = group;
    this.formData = {
      name: group.name,
      description: group.description || ''
    };
    this.showEditModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedGroup = null;
    this.formData = { name: '', description: '' };
  }

  createGroup() {
    if (!this.formData.name.trim()) {
      alert('Group name is required');
      return;
    }

    this.apiService.createGroup(this.formData).subscribe({
      next: () => {
        this.closeModals();
        this.loadGroups();
      },
      error: (e) => {
        console.error('Failed to create group:', e);
        alert(e.error?.message || 'Failed to create group');
      }
    });
  }

  updateGroup() {
    if (!this.selectedGroup || !this.formData.name.trim()) {
      alert('Group name is required');
      return;
    }

    this.apiService.updateGroup(this.selectedGroup.id, this.formData).subscribe({
      next: () => {
        this.closeModals();
        this.loadGroups();
      },
      error: (e) => {
        console.error('Failed to update group:', e);
        alert(e.error?.message || 'Failed to update group');
      }
    });
  }

  deleteGroup(groupId: number) {
    if (!confirm('Are you sure you want to delete this group? This will also delete all seasons and related data.')) {
      return;
    }

    this.apiService.deleteGroup(groupId).subscribe({
      next: () => {
        this.loadGroups();
      },
      error: (e) => {
        console.error('Failed to delete group:', e);
        alert(e.error?.message || 'Failed to delete group');
      }
    });
  }

  viewSeasons(groupId: number) {
    this.router.navigate(['/admin/seasons'], { queryParams: { groupId } });
  }
}
