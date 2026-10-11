import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { Role } from '../../auth/auth.model';
import { homeForRole } from '../../auth/role-home';
import { navItemsFor } from '../navigation';

const ROLE_LABELS: Record<Role, string> = {
  PATIENT: 'Paziente',
  DOCTOR: 'Medico',
  ADMIN: 'Amministratore'
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly items = computed(() => navItemsFor(this.authService.role()));

  protected home(): string {
    return homeForRole(this.authService.role());
  }

  protected roleLabel(role: Role): string {
    return ROLE_LABELS[role];
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
