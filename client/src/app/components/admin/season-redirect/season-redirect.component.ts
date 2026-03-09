import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-season-redirect',
  standalone: true,
  template: '<p class="text-center text-muted p-4">Redirecting...</p>'
})
export class SeasonRedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const seasonId = this.route.snapshot.paramMap.get('seasonId');
    const groupId = this.route.snapshot.queryParamMap.get('groupId');
    this.router.navigate(['/admin/teams'], {
      queryParams: { seasonId, groupId },
      replaceUrl: true
    });
  }
}
