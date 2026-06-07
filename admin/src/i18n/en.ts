const en = {
  common: {
    appName: "Mwasalaty Control",
    save: "Save changes", cancel: "Cancel", delete: "Delete", edit: "Edit", retry: "Retry",
    loading: "Loading", active: "Active", inactive: "Inactive", routes: "Routes", aliases: "Aliases",
    name: "Name", status: "Status", latitude: "Latitude", longitude: "Longitude", line: "Metro line",
    new: "New", back: "Back", confirm: "Confirm", noData: "No records yet", language: "العربية"
  },
  nav: { dashboard: "Dashboard", stops: "Stops", stations: "Stations", logout: "Sign out" },
  auth: {
    title: "Network control room", subtitle: "Use the shared administrator secret to enter.",
    secret: "Administrator secret", submit: "Enter control room", error: "Access could not be verified.",
    sessionExpired: "Your session expired. Sign in again.", signedOut: "You have signed out."
  },
  stateView: {
    loading: { headline: "Loading records", support: "Reading the live transit catalog." },
    empty: { headline: "Nothing here yet", support: "Create the first record to begin." },
    error: { headline: "Could not load records", support: "Check the backend and try again." }
  },
  places: {
    stop: "stop", station: "station", newStop: "New stop", newStation: "New station",
    editStop: "Edit stop", editStation: "Edit station", routeCount: "Serving routes",
    aliasCount: "Aliases", deleteTitle: "Delete this place?", deleteMessage: "This permanently removes the record.",
    aliasesHelp: "Alternate spellings used by rider search.", addAlias: "Add alias", removeAlias: "Remove",
    routesHelp: "Choose at least one known route.", formIntro: "Catalog records update rider lookup immediately.",
    saved: "Record saved.", warningTitle: "Saved with warnings", duplicate: "A nearby record has the same name.",
    outOfCoverage: "This location is outside Greater Cairo coverage.", requiredName: "Name is required.",
    requiredLocation: "Valid coordinates are required.", requiredRoutes: "Choose at least one route.",
    requiredLine: "Metro line is required for stations.", unsaved: "You have unsaved changes. Leave this page?"
  },
  dashboard: {
    title: "Network ledger", subtitle: "A live operational view of the rider-facing catalog.",
    total: "All places", stops: "Bus stops", stations: "Metro stations", active: "Active", inactive: "Inactive",
    byLine: "Stations by line", recent: "Recent changes", quickLinks: "Catalog actions"
  }
};
export default en;
