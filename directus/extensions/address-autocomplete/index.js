/**
 * Directus Interface: Address Autocomplete
 *
 * A text input that queries the geocoding-endpoint extension for
 * Geoapify autocomplete suggestions. When a suggestion is selected,
 * it sets the address value AND auto-fills structured address fields
 * plus latitude/longitude on the same item.
 *
 * Configuration options:
 *   latitudeField   - field name for latitude (default: "latitude")
 *   longitudeField  - field name for longitude (default: "longitude")
 *   cityField       - field name for city (default: "city")
 *   stateField      - field name for state (default: "state")
 *   zipField        - field name for zip/postal code (default: "zip_code")
 */

export default {
  id: "address-autocomplete",
  name: "Address Autocomplete",
  icon: "place",
  description: "Address input with Geoapify autocomplete that auto-fills city, state, zip, lat/lng",
  component: {
    props: {
      value: { type: String, default: "" },
      disabled: { type: Boolean, default: false },
      latitudeField: { type: String, default: "latitude" },
      longitudeField: { type: String, default: "longitude" },
      cityField: { type: String, default: "city" },
      stateField: { type: String, default: "state" },
      zipField: { type: String, default: "zip_code" },
    },
    emits: ["input"],
    data() {
      return {
        query: this.value || "",
        suggestions: [],
        showDropdown: false,
        debounceTimer: null,
        loading: false,
        selectedIndex: -1,
      };
    },
    watch: {
      value(newVal) {
        if (newVal !== this.query) {
          this.query = newVal || "";
        }
      },
    },
    methods: {
      _getApiBase() {
        // Directus admin app sets window.__directus as the API root,
        // or we can derive from the current page URL
        if (window.__directus?.api?.defaults?.baseURL) {
          return window.__directus.api.defaults.baseURL;
        }
        // Fallback: use the current origin (works when admin is served by Directus)
        return window.location.origin;
      },

      async fetchSuggestions() {
        if (!this.query || this.query.length < 3) {
          this.suggestions = [];
          this.showDropdown = false;
          return;
        }

        this.loading = true;
        try {
          const base = this._getApiBase();
          const res = await fetch(
            `${base}/geocoding/autocomplete?text=${encodeURIComponent(this.query)}&limit=5`,
            { credentials: "include" }
          );
          const data = await res.json();
          this.suggestions = data.results || [];
          this.showDropdown = this.suggestions.length > 0;
          this.selectedIndex = -1;
        } catch (e) {
          console.error("Autocomplete error:", e);
          this.suggestions = [];
        } finally {
          this.loading = false;
        }
      },

      onInput(event) {
        this.query = event.target.value;
        this.$emit("input", this.query);

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.fetchSuggestions(), 300);
      },

      selectSuggestion(suggestion) {
        this.query = suggestion.formatted;
        this.showDropdown = false;
        this.suggestions = [];
        this.$emit("input", suggestion.formatted);

        // Auto-fill related fields via Directus form values store
        const formValues = this._getFormValues();
        if (formValues) {
          if (suggestion.lat != null) formValues[this.latitudeField] = suggestion.lat;
          if (suggestion.lon != null) formValues[this.longitudeField] = suggestion.lon;
          if (suggestion.city) formValues[this.cityField] = suggestion.city;
          if (suggestion.state) formValues[this.stateField] = suggestion.state;
          if (suggestion.postcode) formValues[this.zipField] = suggestion.postcode;
        }
      },

      onKeydown(event) {
        if (!this.showDropdown) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          this.selectedIndex = Math.min(
            this.selectedIndex + 1,
            this.suggestions.length - 1
          );
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        } else if (event.key === "Enter" && this.selectedIndex >= 0) {
          event.preventDefault();
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        } else if (event.key === "Escape") {
          this.showDropdown = false;
        }
      },

      onBlur() {
        // Delay to allow click on suggestion
        setTimeout(() => {
          this.showDropdown = false;
        }, 200);
      },

      _getFormValues() {
        // Walk up the component tree to find the form values
        let parent = this.$parent;
        while (parent) {
          if (parent.values || parent.edits) {
            return parent.edits || parent.values;
          }
          parent = parent.$parent;
        }
        return null;
      },
    },
    template: `
      <div style="position: relative; width: 100%;">
        <input
          :value="query"
          @input="onInput"
          @keydown="onKeydown"
          @blur="onBlur"
          @focus="query && query.length >= 3 && suggestions.length > 0 && (showDropdown = true)"
          :disabled="disabled"
          type="text"
          :placeholder="'Start typing an address...'"
          class="input"
          style="width: 100%; padding: 8px 12px; border: var(--theme--border-width) solid var(--theme--form--field--input--border-color); border-radius: var(--theme--border-radius); background-color: var(--theme--form--field--input--background); color: var(--theme--form--field--input--foreground); font-family: var(--theme--fonts--sans--font-family); font-size: 14px; line-height: 1.5;"
        />
        <div v-if="loading" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--theme--form--field--input--foreground-subdued);">
          <svg width="16" height="16" viewBox="0 0 24 24" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div
          v-if="showDropdown && suggestions.length > 0"
          style="position: absolute; z-index: 1000; top: 100%; left: 0; right: 0; margin-top: 4px; background: var(--theme--background); border: var(--theme--border-width) solid var(--theme--form--field--input--border-color); border-radius: var(--theme--border-radius); box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 240px; overflow-y: auto;"
        >
          <div
            v-for="(s, i) in suggestions"
            :key="i"
            @mousedown.prevent="selectSuggestion(s)"
            :style="{
              padding: '10px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              lineHeight: '1.4',
              borderBottom: i < suggestions.length - 1 ? '1px solid var(--theme--border-color-subdued)' : 'none',
              backgroundColor: selectedIndex === i ? 'var(--theme--background-accent)' : 'transparent',
              color: 'var(--theme--foreground)',
            }"
            @mouseenter="selectedIndex = i"
          >
            <div style="display: flex; align-items: flex-start; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px; opacity: 0.5;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div>
                <div>{{ s.formatted }}</div>
                <div v-if="s.lat && s.lon" style="font-size: 11px; opacity: 0.5; margin-top: 2px;">{{ s.lat.toFixed(5) }}, {{ s.lon.toFixed(5) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  options: [
    {
      field: "latitudeField",
      name: "Latitude Field",
      type: "string",
      meta: {
        width: "half",
        interface: "input",
        note: "Field name for latitude on the same collection",
      },
      schema: {
        default_value: "latitude",
      },
    },
    {
      field: "longitudeField",
      name: "Longitude Field",
      type: "string",
      meta: {
        width: "half",
        interface: "input",
        note: "Field name for longitude on the same collection",
      },
      schema: {
        default_value: "longitude",
      },
    },
    {
      field: "cityField",
      name: "City Field",
      type: "string",
      meta: {
        width: "half",
        interface: "input",
        note: "Field name for city on the same collection",
      },
      schema: {
        default_value: "city",
      },
    },
    {
      field: "stateField",
      name: "State Field",
      type: "string",
      meta: {
        width: "half",
        interface: "input",
        note: "Field name for state on the same collection",
      },
      schema: {
        default_value: "state",
      },
    },
    {
      field: "zipField",
      name: "Zip/Postal Code Field",
      type: "string",
      meta: {
        width: "half",
        interface: "input",
        note: "Field name for zip/postal code on the same collection",
      },
      schema: {
        default_value: "zip_code",
      },
    },
  ],
  types: ["string", "text"],
};
