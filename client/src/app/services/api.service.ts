import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:4200/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.authService.getAccessToken()}`
    };
  }

  // Groups APIs
  getGroups(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/groups`, { headers: this.getHeaders() });
  }

  getGroupById(groupId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/groups/${groupId}`, { headers: this.getHeaders() });
  }

  createGroup(data: { name: string; description?: string; auctioneerId?: number | null }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groups`, data, { headers: this.getHeaders() });
  }

  updateGroup(groupId: number, data: { name?: string; description?: string; auctioneerId?: number | null }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/groups/${groupId}`, data, { headers: this.getHeaders() });
  }

  deleteGroup(groupId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/groups/${groupId}`, { headers: this.getHeaders() });
  }

  // Seasons APIs
  getSeasonsByGroup(groupId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/groups/${groupId}/seasons`, { headers: this.getHeaders() });
  }

  getSeasonById(seasonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/seasons/${seasonId}`, { headers: this.getHeaders() });
  }

  createSeason(groupId: number, data: { name: string; year: number; budget?: number; auctioneerId?: number | null }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groups/${groupId}/seasons`, data, { headers: this.getHeaders() });
  }

  updateSeason(seasonId: number, data: { name?: string; year?: number; budget?: number; status?: string; auctioneerId?: number | null }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/seasons/${seasonId}`, data, { headers: this.getHeaders() });
  }

  deleteSeason(seasonId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/seasons/${seasonId}`, { headers: this.getHeaders() });
  }

  cloneSeason(seasonId: number, data: { name: string; year: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seasons/${seasonId}/clone`, data, { headers: this.getHeaders() });
  }

  // Season Owners APIs (scoped per season - not shared across groups)
  getSeasonOwners(seasonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/seasons/${seasonId}/owners`, { headers: this.getHeaders() });
  }

  addSeasonOwner(seasonId: number, data: { email: string; password: string; name: string } | { userId: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seasons/${seasonId}/owners`, data, { headers: this.getHeaders() });
  }

  removeSeasonOwner(seasonId: number, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/seasons/${seasonId}/owners/${userId}`, { headers: this.getHeaders() });
  }

  // Teams APIs
  getTeamsBySeason(seasonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/seasons/${seasonId}/teams`, { headers: this.getHeaders() });
  }

  createTeam(seasonId: number, data: { name: string; ownerId?: number; budget?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seasons/${seasonId}/teams`, data, { headers: this.getHeaders() });
  }

  updateTeam(teamId: number, data: { name?: string; ownerId?: number; budget?: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/teams/${teamId}`, data, { headers: this.getHeaders() });
  }

  deleteTeam(teamId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/teams/${teamId}`, { headers: this.getHeaders() });
  }

  // Players APIs (Group level)
  getPlayersByGroup(groupId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/groups/${groupId}/players`, { headers: this.getHeaders() });
  }

  addPlayerToGroup(groupId: number, data: { name: string; category: string; basePrice: number; country?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groups/${groupId}/players`, data, { headers: this.getHeaders() });
  }

  uploadPlayersCSV(groupId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/groups/${groupId}/players/upload`, formData, { headers: this.getHeaders() });
  }

  updatePlayer(playerId: number, data: { name?: string; category?: string; basePrice?: number; country?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/players/${playerId}`, data, { headers: this.getHeaders() });
  }

  deletePlayer(playerId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/players/${playerId}`, { headers: this.getHeaders() });
  }

  // Players APIs (Season level)
  getPlayersBySeason(seasonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/seasons/${seasonId}/players`, { headers: this.getHeaders() });
  }

  addPlayersToSeason(seasonId: number, playerIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seasons/${seasonId}/players`, { playerIds }, { headers: this.getHeaders() });
  }

  updateSeasonPlayer(seasonPlayerId: number, data: { status?: string; soldPrice?: number; teamId?: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/season-players/${seasonPlayerId}`, data, { headers: this.getHeaders() });
  }

  removePlayerFromSeason(seasonId: number, playerId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/seasons/${seasonId}/players/${playerId}`, { headers: this.getHeaders() });
  }

  // Direct Assignment APIs (use seasonPlayerId OR playerId - playerId assigns group player, auto-adds to season)
  directAssignPlayer(seasonId: number, data: { seasonPlayerId?: number; playerId?: number; teamId: number; amount: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seasons/${seasonId}/direct-assign`, data, { headers: this.getHeaders() });
  }

  bulkDirectAssign(seasonId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/seasons/${seasonId}/direct-assign/bulk`, formData, { headers: this.getHeaders() });
  }

  removeDirectAssignment(seasonId: number, seasonPlayerId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seasons/${seasonId}/direct-assign/remove`, { seasonPlayerId }, { headers: this.getHeaders() });
  }

  // Auction Room APIs
  getAuctionRooms(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auction-rooms`, { headers: this.getHeaders() });
  }

  getAuctioneers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auction-rooms/auctioneers`, { headers: this.getHeaders() });
  }

  createAuctionRoom(data: { seasonId: number; auctioneerId: number; name?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction-rooms`, data, { headers: this.getHeaders() });
  }

  deleteAuctionRoom(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/auction-rooms/${id}`, { headers: this.getHeaders() });
  }

  // Auction APIs
  getAuctionState(seasonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auction/seasons/${seasonId}/state`, { headers: this.getHeaders() });
  }

  startAuction(seasonId: number, playerId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction/seasons/${seasonId}/start`, { playerId }, { headers: this.getHeaders() });
  }

  startRandomAuction(seasonId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction/seasons/${seasonId}/start-random`, {}, { headers: this.getHeaders() });
  }

  pauseAuction(seasonId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction/seasons/${seasonId}/pause`, {}, { headers: this.getHeaders() });
  }

  resumeAuction(seasonId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction/seasons/${seasonId}/resume`, {}, { headers: this.getHeaders() });
  }

  completeAuction(seasonId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction/seasons/${seasonId}/complete`, {}, { headers: this.getHeaders() });
  }

  undoLastBid(seasonId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction/seasons/${seasonId}/undo-bid`, {}, { headers: this.getHeaders() });
  }

  reopenPlayer(seasonId: number, playerId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auction/seasons/${seasonId}/reopen-player`, { playerId }, { headers: this.getHeaders() });
  }
}
