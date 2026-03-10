import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminLayoutComponent } from './components/admin/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { GroupsComponent } from './components/admin/groups/groups.component';
import { SeasonsComponent } from './components/admin/seasons/seasons.component';
import { TeamsComponent } from './components/admin/teams/teams.component';
import { PlayersComponent } from './components/admin/players/players.component';
import { AuctionRoomComponent } from './components/admin/auction-room/auction-room.component';
import { AuctionRoomsComponent } from './components/admin/auction-rooms/auction-rooms.component';
import { ReportsComponent } from './components/admin/reports/reports.component';
import { SeasonRedirectComponent } from './components/admin/season-redirect/season-redirect.component';
import { AuctioneerLayoutComponent } from './components/auctioneer/auctioneer-layout.component';
import { AuctioneerRoomsComponent } from './components/auctioneer/auctioneer-rooms/auctioneer-rooms.component';
import { OwnerLayoutComponent } from './components/owner/owner-layout.component';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'owner',
        component: OwnerLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: DashboardComponent },
            { path: 'dashboard', component: DashboardComponent }
        ]
    },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: AdminDashboardComponent },
            { path: 'groups', component: GroupsComponent },
            { path: 'seasons', component: SeasonsComponent },
            { path: 'seasons/:seasonId', component: SeasonRedirectComponent },
            { path: 'teams', component: TeamsComponent },
            { path: 'players', component: PlayersComponent },
            { path: 'auction-rooms', component: AuctionRoomsComponent },
            { path: 'auction-room', component: AuctionRoomComponent },
            { path: 'reports', component: ReportsComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    {
        path: 'auctioneer',
        component: AuctioneerLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: AuctioneerRoomsComponent },
            { path: 'conduct', component: AuctionRoomComponent }
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
