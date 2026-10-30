import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Role } from "../../auth/auth.model";
import { navItemsFor } from "../../layout/navigation";
import { homeForRole } from "../../auth/role-home";

@Component({
    selector: 'app-shortcuts',
    imports: [RouterLink],
    template: `
        <div class="d-flex flex-wrap gap-2">
            @for (item of items(); track item.path) {
                <a class="btn btn-outline-primary shortcut" [routerLink]="item.path">{{ item.label }}</a>
            }
        </div>
    `,
})
export class Shortcuts {
    readonly role = input.required<Role>();
    protected readonly items = computed(() => navItemsFor(this.role()).filter((item) => item.path !== homeForRole(this.role())));
}