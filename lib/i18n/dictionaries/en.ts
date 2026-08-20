import type { Permission } from "@/lib/auth/permission-keys";

export interface Dictionary {
  nav: {
    dashboard: string;
    tours: string;
    bookings: string;
    customers: string;
    vehicles: string;
    staff: string;
    finances: string;
    settings: string;
    mySchedule: string;
    agencies: string;
    allUsers: string;
    rolePermissions: string;
    agencyCrmSection: string;
    platformSection: string;
  };
  mobileNav: {
    openMenu: string;
    closeMenu: string;
    travelAgency: string;
    superAdmin: string;
  };
  topbar: {
    requiredAgency: string;
    myAgency: string;
    selectAgency: string;
    switchRole: string;
    settings: string;
    logOut: string;
    pendingBookings: string;
  };
  languageSwitcher: {
    english: string;
    russian: string;
  };
  agenciesPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    noAgencies: string;
    noOwner: string;
    users: string;
    tours: string;
    bookings: string;
    connected: string;
    manageUsers: string;
    openCrm: string;
  };
  agencyForm: {
    title: string;
    agencyName: string;
    agencyOwner: string;
    selectOwner: string;
    agencySingular: string;
    agencyPlural: string;
    createOwnerHintPrefix: string;
    allUsersLink: string;
    createOwnerHintSuffix: string;
    submit: string;
    submitting: string;
  };
  roles: {
    OWNER: string;
    OPERATOR: string;
    DRIVER: string;
    GUIDE: string;
    DRIVER_GUIDE: string;
  };
  usersPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    errorRoles: string;
    errorAssignedOwner: string;
    noUsers: string;
    primaryAgency: string;
    unassigned: string;
    owns: string;
    saveRoles: string;
  };
  platformUserForm: {
    title: string;
    agency: string;
    agencyHint: string;
    agencyUnassigned: string;
    name: string;
    email: string;
    temporaryPassword: string;
    rolesLabel: string;
    submit: string;
    submitting: string;
  };
  selectRolePage: {
    title: string;
    subtitle: string;
    continueAs: string;
  };
  userStatus: {
    ACTIVE: string;
    INVITED: string;
    DISABLED: string;
  };
  rolesPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    permissionsEnabled: string;
    alwaysOnForOwner: string;
    ownerOnly: string;
    saveButtonPrefix: string;
    saveButtonSuffix: string;
    groups: {
      tours: string;
      departures: string;
      bookings: string;
      customers: string;
      fleet: string;
      team: string;
      finances: string;
      schedule: string;
      agencySettings: string;
    };
    permissions: Record<Permission, string>;
  };
  bookingStatus: {
    PENDING: string;
    CONFIRMED: string;
    CANCELLED: string;
    COMPLETED: string;
    NO_SHOW: string;
  };
  departureStatus: {
    SCHEDULED: string;
    CONFIRMED: string;
    CANCELLED: string;
    COMPLETED: string;
  };
  paymentStatus: {
    UNPAID: string;
    PARTIAL: string;
    PAID: string;
    REFUNDED: string;
  };
  paymentMethod: {
    CASH: string;
    BANK_TRANSFER: string;
    CARD_ONLINE: string;
    OTHER: string;
  };
  paymentRecordStatus: {
    PENDING: string;
    COMPLETED: string;
    FAILED: string;
    REFUNDED: string;
  };
  travelerPriceType: {
    FULL: string;
    HALF: string;
    FREE: string;
  };
  attendanceStatus: {
    WORKED: string;
    ABSENT: string;
  };
  bookingSource: {
    MANUAL: string;
    ONLINE: string;
  };
  dashboardPage: {
    welcomeBack: string;
    todayIntroPrefix: string;
    todayIntroSuffix: string;
    yourAgency: string;
    totalTours: string;
    totalBookings: string;
    totalCustomers: string;
    upcomingDepartures: string;
    published: string;
    thisMonth: string;
    bookingsLast30Days: string;
    recentBookings: string;
    viewAll: string;
    noBookingsYet: string;
    bookingStatusTitle: string;
    popularTours: string;
    bookingsSuffix: string;
    readyForNextDeparture: string;
    newTour: string;
  };
  common: {
    other: string;
  };
  tourCategories: Record<string, string>;
  armenianRegions: Record<string, string>;
  vehicleTypes: Record<string, string>;
  tourForm: {
    title: string;
    description: string;
    category: string;
    region: string;
    durationDays: string;
    basePrice: string;
    photosPrefix: string;
    choosePhoto: string;
    uploading: string;
    photoUploaded: string;
    tryAgain: string;
    addAnother: string;
    removeImage: string;
    publishedLabel: string;
    saving: string;
    uploadingPhotos: string;
    customCategoryPlaceholder: string;
    customVehiclePlaceholder: string;
    crossBorder: string;
    selectRegionWarning: string;
    uploadFailed: string;
  };
  toursPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    newTourButton: string;
    active: string;
    deleted: string;
    searchPlaceholder: string;
    emptyNoMatchTitle: string;
    emptyNoMatchMessage: string;
    emptyNoDeletedTitle: string;
    emptyNoDeletedMessage: string;
    emptyWaitingTitle: string;
    emptyWaitingMessage: string;
    deletedBadge: string;
    publishedBadge: string;
    draftBadge: string;
    nextDeparturePrefix: string;
    noUpcomingDepartures: string;
    daySuffix: string;
    departuresLink: string;
    editLink: string;
    deleteLink: string;
    restoreLink: string;
  };
  newTourPage: {
    subtitle: string;
    submitLabel: string;
  };
  editTourPage: {
    subtitle: string;
    submitLabel: string;
  };
  dateTimePicker: {
    weekdays: [string, string, string, string, string, string, string];
    selectDateTime: string;
    clear: string;
    previousMonth: string;
    nextMonth: string;
    time24h: string;
    timeFormatHint: string;
    mustBeAfter: string;
    cancel: string;
    ok: string;
  };
  departureCrew: {
    driver: string;
    guide: string;
    crewAssigned: string;
  };
  departureForm: {
    departureLabel: string;
    estimatedReturn: string;
    selectReturnPlaceholder: string;
    returnHint: string;
    vehiclesCrew: string;
    vehicleNumberPrefix: string;
    removeVehiclePrefix: string;
    vehicleLabel: string;
    noVehicle: string;
    seatsSuffix: string;
    driverLabel: string;
    noDriver: string;
    guideLabel: string;
    noGuide: string;
    addAnotherVehicle: string;
    capacityHint: string;
    capacityLabel: string;
    priceOverrideLabel: string;
    notesLabel: string;
    saving: string;
    addDepartureDefault: string;
  };
  departuresPage: {
    eyebrow: string;
    subtitle: string;
    viewBookings: string;
    whenUpcoming: string;
    whenPast: string;
    whenAll: string;
    emptyNoUpcomingTitle: string;
    emptyNoPastTitle: string;
    emptyNoneTitle: string;
    emptyUpcomingMessage: string;
    emptyOtherMessage: string;
    bookedSuffix: string;
    backPrefix: string;
    bookLink: string;
    editLink: string;
    cancelLink: string;
    deleteLink: string;
    addDepartureHeading: string;
    editDeparturePrefix: string;
  };
  phoneInput: {
    searchPlaceholder: string;
    noMatches: string;
    invalidNumberPrefix: string;
    invalidNumberSuffix: string;
    incompleteNumberPrefix: string;
    incompleteNumberSuffix: string;
  };
  bookingsPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    clearFilter: string;
    filterByStatus: string;
    filterByPayment: string;
    filterByDepartureDate: string;
    scopeDepartureTemplate: string;
    scopeTourTemplate: string;
    emptyFilteredTitle: string;
    emptyFilteredMessage: string;
    emptyDefaultTitle: string;
    emptyDefaultMessage: string;
    paxSuffix: string;
    statusAll: string;
    paymentAll: string;
  };
  newBookingPage: {
    eyebrow: string;
    seatsLeftInfix: string;
    seatsLeftSuffix: string;
    perPaxSuffix: string;
    fullyBooked: string;
  };
  bookingForm: {
    customer: string;
    newCustomerName: string;
    newCustomerEmail: string;
    newCustomerPhone: string;
    paxCountPrefix: string;
    otherTravelers: string;
    otherTravelersHint: string;
    travelerNamePrefix: string;
    travelerNameSuffix: string;
    child: string;
    fullPrice: string;
    halfPrice: string;
    free: string;
    discountPercent: string;
    estimatedTotal: string;
    specialRequests: string;
    booking: string;
    createBooking: string;
  };
  customerCombobox: {
    clearSelected: string;
    searchPlaceholder: string;
    newCustomer: string;
    searching: string;
    noCustomersFound: string;
  };
  bookingDetailPage: {
    eyebrow: string;
    customer: string;
    pax: string;
    totalPrice: string;
    discountAppliedSuffix: string;
    paymentStatus: string;
    paidOfInfix: string;
    status: string;
    source: string;
    specialRequests: string;
    partyPrefix: string;
    partySuffix: string;
    moreTravelersSuffix: string;
    confirmBooking: string;
    markCompleted: string;
    cancelBooking: string;
    payments: string;
    noPaymentsYet: string;
    void: string;
  };
  paymentForm: {
    amountPrefix: string;
    method: string;
    date: string;
    referenceOptional: string;
    referencePlaceholder: string;
    saving: string;
    recordPayment: string;
  };
  customersPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    newCustomerButton: string;
    searchPlaceholder: string;
    emptyNoMatchTitle: string;
    emptyNoMatchMessage: string;
    emptyDefaultTitle: string;
    emptyDefaultMessage: string;
    noContactInfo: string;
  };
  customerForm: {
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    selectNationality: string;
    notes: string;
    saving: string;
  };
  newCustomerPage: {
    subtitle: string;
    submitLabel: string;
  };
  editCustomerPage: {
    editPrefix: string;
    submitLabel: string;
  };
  customerDetailPage: {
    editLink: string;
    deleteLink: string;
    totalBookings: string;
    cancelled: string;
    cancellationRateSuffix: string;
    noShows: string;
    totalSpent: string;
    honoredBookingsSuffix: string;
    bookingsHeading: string;
  };
  vehiclesPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    newVehicleButton: string;
    emptyTitle: string;
    emptyMessage: string;
    inactiveSuffix: string;
    editLink: string;
    deactivate: string;
    activate: string;
    deleteLink: string;
  };
  vehicleForm: {
    name: string;
    namePlaceholder: string;
    type: string;
    capacity: string;
    licensePlate: string;
    driverName: string;
    driverPhone: string;
    saving: string;
  };
  newVehiclePage: {
    title: string;
    subtitle: string;
    submitLabel: string;
  };
  editVehiclePage: {
    subtitle: string;
    submitLabel: string;
  };
  vehicleDetailPage: {
    editLink: string;
    deactivatedWarning: string;
    upcomingDeparturesHeading: string;
    emptyTitle: string;
    emptyMessage: string;
  };
  staffPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    newStaffButton: string;
    searchPlaceholder: string;
    emptySearchTitle: string;
    emptySearchMessage: string;
    youSuffix: string;
    disabledBadge: string;
    attendanceLink: string;
    editLink: string;
    activate: string;
    disable: string;
  };
  staffForm: {
    name: string;
    email: string;
    password: string;
    phone: string;
    rolesLabel: string;
    rolesHint: string;
    operatorHint: string;
    driverHint: string;
    guideHint: string;
    driverGuideHint: string;
    saving: string;
  };
  newStaffPage: {
    title: string;
    subtitle: string;
    submitLabel: string;
  };
  editStaffPage: {
    subtitle: string;
    submitLabel: string;
  };
  attendancePage: {
    titleSuffix: string;
    daysWorkedSuffix: string;
    absentInInfix: string;
    backToStaff: string;
    prev: string;
    next: string;
    markWorkedPrefix: string;
    markAbsentPrefix: string;
    clear: string;
  };
  financesPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    totalRevenue: string;
    collected: string;
    outstanding: string;
    paymentsRecorded: string;
    byCurrency: string;
    collectedOfInfix: string;
    recentPayments: string;
    emptyTitle: string;
    emptyMessage: string;
    void: string;
    byPaymentMethod: string;
    noPaymentsYet: string;
  };
  schedulePage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    emptyNoUpcomingTitle: string;
    emptyNoPastTitle: string;
    emptyNoneTitle: string;
    emptyMessage: string;
  };
  settingsPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  orgSettingsForm: {
    agencyName: string;
    descriptionLabel: string;
    contactEmail: string;
    contactPhone: string;
    publishedPrefix: string;
    publishedSuffix: string;
    saved: string;
    saving: string;
    saveSettings: string;
  };
  loginPage: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    loggingIn: string;
    submit: string;
    footerNote: string;
    tooManyAttempts: string;
    invalidCredentials: string;
  };
  registerPage: {
    title: string;
    message: string;
    goToLogin: string;
  };
  publicLayout: {
    browseTours: string;
    agencyLogin: string;
    footer: string;
  };
  homePage: {
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroSubtitle: string;
    browseToursButton: string;
    featuredTours: string;
  };
  toursSearchPage: {
    title: string;
    searchPlaceholder: string;
    searchButton: string;
    noToursFound: string;
    daySuffix: string;
  };
  tourDetailPage: {
    byPrefix: string;
    daysSuffix: string;
    perPaxSuffix: string;
    upcomingDeparturesHeading: string;
    noUpcomingDepartures: string;
    seatsLeftSuffix: string;
    fullyBooked: string;
    bookButton: string;
  };
  agencyProfilePage: {
    toursHeading: string;
    noPublishedTours: string;
  };
  bookDeparturePage: {
    perPaxSuffix: string;
    fullyBookedMessage: string;
  };
  guestBookingForm: {
    fullName: string;
    email: string;
    phone: string;
    paxCountPrefix: string;
    specialRequests: string;
    booking: string;
    requestBooking: string;
  };
  guestBookingStatusPage: {
    title: string;
    paxSuffix: string;
    statusPrefix: string;
    paymentPrefix: string;
    contactMessagePrefix: string;
    contactMessageSuffix: string;
  };
  notFoundPage: {
    pageNotFoundTitle: string;
    couldNotFindTitle: string;
    message: string;
    goHome: string;
    backToDashboard: string;
    backToRoles: string;
  };
  errorBoundary: {
    title: string;
    snagWithRefPrefix: string;
    snagWithRefSuffix: string;
    snagNoRef: string;
    tryAgain: string;
    goHome: string;
    globalWithRefPrefix: string;
    globalWithRefSuffix: string;
    globalNoRef: string;
  };
}

const en: Dictionary = {
  nav: {
    dashboard: "Dashboard",
    tours: "Tours",
    bookings: "Bookings",
    customers: "Customers",
    vehicles: "Vehicles",
    staff: "Staff",
    finances: "Finances",
    settings: "Settings",
    mySchedule: "My schedule",
    agencies: "Agencies",
    allUsers: "All users",
    rolePermissions: "Role permissions",
    agencyCrmSection: "Agency CRM",
    platformSection: "Platform",
  },
  mobileNav: {
    openMenu: "Open menu",
    closeMenu: "Close menu",
    travelAgency: "Travel Agency",
    superAdmin: "Super Admin",
  },
  topbar: {
    requiredAgency: "Required agency",
    myAgency: "My agency",
    selectAgency: "Select agency…",
    switchRole: "Switch role",
    settings: "Settings",
    logOut: "Log out",
    pendingBookings: "pending bookings",
  },
  languageSwitcher: {
    english: "English",
    russian: "Russian",
  },
  agenciesPage: {
    eyebrow: "Platform administration",
    title: "Travel agencies",
    subtitle: "Create agencies, provision their owner, or enter an agency CRM as Super Admin.",
    noAgencies: "No agencies created yet.",
    noOwner: "No owner",
    users: "users",
    tours: "tours",
    bookings: "bookings",
    connected: "Connected",
    manageUsers: "Manage users",
    openCrm: "Open CRM",
  },
  agencyForm: {
    title: "Create travel agency",
    agencyName: "Agency name",
    agencyOwner: "Agency owner",
    selectOwner: "Select an existing Owner user…",
    agencySingular: "agency",
    agencyPlural: "agencies",
    createOwnerHintPrefix: "Create a user with the Owner role in",
    allUsersLink: "All users",
    createOwnerHintSuffix: "first.",
    submit: "Create agency",
    submitting: "Creating…",
  },
  roles: {
    OWNER: "Owner",
    OPERATOR: "Operator",
    DRIVER: "Driver",
    GUIDE: "Guide",
    DRIVER_GUIDE: "Driver-Guide",
  },
  usersPage: {
    eyebrow: "Platform administration",
    title: "All users",
    subtitle: "Create standard agency users and assign one or more roles, including Owner.",
    errorRoles: "Every user must have at least one role.",
    errorAssignedOwner: "This user owns one or more agencies. Reassign those agencies before removing the Owner role.",
    noUsers: "No agency users yet.",
    primaryAgency: "Primary agency",
    unassigned: "Unassigned",
    owns: "Owns",
    saveRoles: "Save roles",
  },
  platformUserForm: {
    title: "Create standard user",
    agency: "Agency",
    agencyHint: "(optional for an Owner candidate)",
    agencyUnassigned: "Unassigned — select Owner role below",
    name: "Name",
    email: "Email",
    temporaryPassword: "Temporary password",
    rolesLabel: "Roles",
    submit: "Create user",
    submitting: "Creating…",
  },
  selectRolePage: {
    title: "Choose your role",
    subtitle: "Your permissions and dashboard will use the role you select. You can change it later from your profile.",
    continueAs: "Continue as",
  },
  userStatus: {
    ACTIVE: "Active",
    INVITED: "Invited",
    DISABLED: "Disabled",
  },
  rolesPage: {
    eyebrow: "Access control",
    title: "Roles & permissions",
    subtitle: "Changes here apply platform-wide, to every agency's staff, immediately.",
    permissionsEnabled: "permissions enabled",
    alwaysOnForOwner: "(always on for Owner)",
    ownerOnly: "(Owner only)",
    saveButtonPrefix: "Save",
    saveButtonSuffix: "permissions",
    groups: {
      tours: "Tours",
      departures: "Departures",
      bookings: "Bookings",
      customers: "Customers",
      fleet: "Fleet",
      team: "Team",
      finances: "Finances",
      schedule: "Schedule",
      agencySettings: "Agency settings",
    },
    permissions: {
      "tours:view": "View tours",
      "tours:manage": "Create & edit tours",
      "tours:delete": "Delete tours",
      "departures:manage": "Create, cancel & assign departures",
      "departures:delete": "Delete departures",
      "bookings:view": "View bookings",
      "bookings:manage": "Create & update bookings",
      "customers:view": "View customers",
      "customers:manage": "Create & edit customers",
      "customers:delete": "Delete customers",
      "vehicles:view": "View vehicles",
      "vehicles:manage": "Create & edit vehicles",
      "vehicles:delete": "Delete vehicles",
      "staff:view": "View staff",
      "staff:manage": "Create & edit staff",
      "attendance:manage": "Manage attendance",
      "finances:view": "View finances",
      "finances:manage": "Record & void payments",
      "schedule:view-own": "View own schedule",
      "org:settings-manage": "Manage agency settings",
    },
  },
  bookingStatus: {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
    NO_SHOW: "No-show",
  },
  departureStatus: {
    SCHEDULED: "Scheduled",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  },
  paymentStatus: {
    UNPAID: "Unpaid",
    PARTIAL: "Partial",
    PAID: "Paid",
    REFUNDED: "Refunded",
  },
  paymentMethod: {
    CASH: "Cash",
    BANK_TRANSFER: "Bank transfer",
    CARD_ONLINE: "Card (online)",
    OTHER: "Other",
  },
  paymentRecordStatus: {
    PENDING: "Pending",
    COMPLETED: "Completed",
    FAILED: "Failed",
    REFUNDED: "Refunded",
  },
  travelerPriceType: {
    FULL: "Full",
    HALF: "Half",
    FREE: "Free",
  },
  attendanceStatus: {
    WORKED: "Worked",
    ABSENT: "Absent",
  },
  bookingSource: {
    MANUAL: "Manual",
    ONLINE: "Online",
  },
  dashboardPage: {
    welcomeBack: "Welcome back",
    todayIntroPrefix: "Here's what's happening with",
    todayIntroSuffix: "today.",
    yourAgency: "your agency",
    totalTours: "Total tours",
    totalBookings: "Total bookings",
    totalCustomers: "Total customers",
    upcomingDepartures: "Upcoming departures",
    published: "published",
    thisMonth: "this month",
    bookingsLast30Days: "Bookings, last 30 days",
    recentBookings: "Recent bookings",
    viewAll: "View all",
    noBookingsYet: "No bookings yet.",
    bookingStatusTitle: "Booking status",
    popularTours: "Popular tours",
    bookingsSuffix: "bookings",
    readyForNextDeparture: "Ready for your next departure?",
    newTour: "New tour",
  },
  common: {
    other: "Other…",
  },
  tourCategories: {
    cultural: "cultural",
    historical: "historical",
    religious: "religious",
    nature: "nature",
    hiking: "hiking",
    adventure: "adventure",
    wine: "wine",
    culinary: "culinary",
    city: "city",
    wildlife: "wildlife",
    photography: "photography",
    family: "family",
    "day-trip": "day-trip",
    "multi-day": "multi-day",
  },
  armenianRegions: {
    Yerevan: "Yerevan",
    Aragatsotn: "Aragatsotn",
    Ararat: "Ararat",
    Armavir: "Armavir",
    Gegharkunik: "Gegharkunik",
    Kotayk: "Kotayk",
    Lori: "Lori",
    Shirak: "Shirak",
    Syunik: "Syunik",
    Tavush: "Tavush",
    "Vayots Dzor": "Vayots Dzor",
    Georgia: "Georgia",
  },
  vehicleTypes: {
    Bus: "Bus",
    Minivan: "Minivan",
    Car: "Car",
    Jeep: "Jeep",
    SUV: "SUV",
  },
  tourForm: {
    title: "Title",
    description: "Description",
    category: "Category",
    region: "Region",
    durationDays: "Duration (days)",
    basePrice: "Base price (AMD)",
    photosPrefix: "Photos (up to",
    choosePhoto: "Choose photo",
    uploading: "Uploading…",
    photoUploaded: "Photo uploaded",
    tryAgain: "Try again",
    addAnother: "Add another",
    removeImage: "Remove image",
    publishedLabel: "Published (visible on the public marketplace)",
    saving: "Saving…",
    uploadingPhotos: "Uploading photos…",
    customCategoryPlaceholder: "Custom category",
    customVehiclePlaceholder: "Custom vehicle type",
    crossBorder: "Cross-border:",
    selectRegionWarning: "Select at least one region — this powers the marketplace filter later.",
    uploadFailed: "Upload failed.",
  },
  toursPage: {
    eyebrow: "Your catalogue",
    title: "Tours",
    subtitle: "The experiences your agency offers, from monastery day trips to multi-day journeys.",
    newTourButton: "+ New tour",
    active: "Active",
    deleted: "Deleted",
    searchPlaceholder: "Search tours by title or description…",
    emptyNoMatchTitle: "No tours match your search",
    emptyNoMatchMessage: "Try a different title or keyword.",
    emptyNoDeletedTitle: "No deleted tours",
    emptyNoDeletedMessage: "Deleted tours will appear here and can be restored.",
    emptyWaitingTitle: "Your catalogue is waiting",
    emptyWaitingMessage: "Add your first tour — an itinerary, a price, a story worth telling.",
    deletedBadge: "Deleted",
    publishedBadge: "Published",
    draftBadge: "Draft",
    nextDeparturePrefix: "Next:",
    noUpcomingDepartures: "No upcoming departures",
    daySuffix: "d",
    departuresLink: "Departures",
    editLink: "Edit",
    deleteLink: "Delete",
    restoreLink: "Restore",
  },
  newTourPage: {
    subtitle: "Describe the journey — the details become the listing your travelers see.",
    submitLabel: "Create tour",
  },
  editTourPage: {
    subtitle: "Refine the details of this tour.",
    submitLabel: "Save changes",
  },
  dateTimePicker: {
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    selectDateTime: "Select date & time",
    clear: "Clear",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    time24h: "Time (24h)",
    timeFormatHint: "Enter a time as HH:mm, e.g. 14:30.",
    mustBeAfter: "Must be after",
    cancel: "Cancel",
    ok: "OK",
  },
  departureCrew: {
    driver: "Driver",
    guide: "Guide",
    crewAssigned: "Crew assigned",
  },
  departureForm: {
    departureLabel: "Departure (leaving)",
    estimatedReturn: "Estimated return (optional)",
    selectReturnPlaceholder: "Select return date & time",
    returnHint: "Used to check vehicles are free for other departures. Left blank, a vehicle is assumed booked for a full 24h.",
    vehiclesCrew: "Vehicles & crew (optional)",
    vehicleNumberPrefix: "Vehicle #",
    removeVehiclePrefix: "Remove vehicle #",
    vehicleLabel: "Vehicle",
    noVehicle: "No vehicle",
    seatsSuffix: "seats",
    driverLabel: "Driver",
    noDriver: "No driver",
    guideLabel: "Guide",
    noGuide: "No guide",
    addAnotherVehicle: "+ Add another vehicle",
    capacityHint: "Selecting vehicles suggests a total seat count below — feel free to change it. Add more than one for tours that run several vehicles at once (e.g. a jeeping tour).",
    capacityLabel: "Capacity",
    priceOverrideLabel: "Price override (optional)",
    notesLabel: "Notes",
    saving: "Saving…",
    addDepartureDefault: "Add departure",
  },
  departuresPage: {
    eyebrow: "Your catalogue",
    subtitle: "Scheduled departures and their remaining seats.",
    viewBookings: "View bookings",
    whenUpcoming: "Upcoming",
    whenPast: "Past",
    whenAll: "All",
    emptyNoUpcomingTitle: "No upcoming departures",
    emptyNoPastTitle: "No past departures",
    emptyNoneTitle: "No departures on the calendar",
    emptyUpcomingMessage: "Schedule a date and this tour becomes bookable — by you and by travelers.",
    emptyOtherMessage: "Nothing to show for this filter yet.",
    bookedSuffix: "booked",
    backPrefix: "back",
    bookLink: "Book",
    editLink: "Edit",
    cancelLink: "Cancel",
    deleteLink: "Delete",
    addDepartureHeading: "Add a departure",
    editDeparturePrefix: "Edit departure —",
  },
  phoneInput: {
    searchPlaceholder: "Search country or code…",
    noMatches: "No matches.",
    invalidNumberPrefix: "Enter a valid",
    invalidNumberSuffix: "phone number.",
    incompleteNumberPrefix: "That doesn't look like a complete",
    incompleteNumberSuffix: "number — check the digit count.",
  },
  bookingsPage: {
    eyebrow: "Your ledger",
    title: "Bookings",
    subtitle: "Every traveler who has reserved a place on one of your tours.",
    clearFilter: "Clear filter",
    filterByStatus: "Filter by status",
    filterByPayment: "Filter by payment status",
    filterByDepartureDate: "Filter by departure date",
    scopeDepartureTemplate: "Everyone who booked",
    scopeTourTemplate: "Everyone who has booked",
    emptyFilteredTitle: "No bookings match these filters",
    emptyFilteredMessage: "Try a different combination of filters.",
    emptyDefaultTitle: "Your ledger is empty, for now",
    emptyDefaultMessage: "Bookings appear here the moment a traveler reserves a seat — or you add one yourself from a departure.",
    paxSuffix: "pax",
    statusAll: "All statuses",
    paymentAll: "All payments",
  },
  newBookingPage: {
    eyebrow: "Your ledger",
    seatsLeftInfix: "of",
    seatsLeftSuffix: "seats left",
    perPaxSuffix: "/ pax",
    fullyBooked: "This departure is fully booked.",
  },
  bookingForm: {
    customer: "Customer",
    newCustomerName: "New customer name",
    newCustomerEmail: "New customer email",
    newCustomerPhone: "New customer phone",
    paxCountPrefix: "Pax count (max",
    otherTravelers: "Other travelers in this party",
    otherTravelersHint: "The customer above counts as traveler 1. Add the rest here if you need their names — leave blank if unknown.",
    travelerNamePrefix: "Traveler",
    travelerNameSuffix: "name",
    child: "Child",
    fullPrice: "Full price",
    halfPrice: "Half price",
    free: "Free",
    discountPercent: "Discount (%)",
    estimatedTotal: "Estimated total",
    specialRequests: "Special requests",
    booking: "Booking…",
    createBooking: "Create booking",
  },
  customerCombobox: {
    clearSelected: "Clear selected customer",
    searchPlaceholder: "Search customers by name, email or phone…",
    newCustomer: "New customer",
    searching: "Searching…",
    noCustomersFound: "No customers found.",
  },
  bookingDetailPage: {
    eyebrow: "Your ledger",
    customer: "Customer",
    pax: "Pax",
    totalPrice: "Total price",
    discountAppliedSuffix: "% discount applied",
    paymentStatus: "Payment status",
    paidOfInfix: "paid of",
    status: "Status",
    source: "Source",
    specialRequests: "Special requests",
    partyPrefix: "Party (",
    partySuffix: "pax)",
    moreTravelersSuffix: "more traveler(s), name not recorded.",
    confirmBooking: "Confirm booking",
    markCompleted: "Mark completed",
    cancelBooking: "Cancel booking",
    payments: "Payments",
    noPaymentsYet: "No payments recorded yet.",
    void: "Void",
  },
  paymentForm: {
    amountPrefix: "Amount",
    method: "Method",
    date: "Date",
    referenceOptional: "Reference (optional)",
    referencePlaceholder: "e.g. receipt #",
    saving: "Saving…",
    recordPayment: "Record payment",
  },
  customersPage: {
    eyebrow: "Your travelers",
    title: "Customers",
    subtitle: "The people you've welcomed on tour, and the ones about to be.",
    newCustomerButton: "+ New customer",
    searchPlaceholder: "Search by name, email, or phone…",
    emptyNoMatchTitle: "No customers match your search",
    emptyNoMatchMessage: "Try a different name, email, or phone number.",
    emptyDefaultTitle: "No travelers yet",
    emptyDefaultMessage: "Add a customer by hand, or they'll appear here the moment they book a tour.",
    noContactInfo: "No contact info",
  },
  customerForm: {
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    nationality: "Nationality",
    selectNationality: "Select nationality…",
    notes: "Notes",
    saving: "Saving…",
  },
  newCustomerPage: {
    subtitle: "A few details now save you a search later.",
    submitLabel: "Create customer",
  },
  editCustomerPage: {
    editPrefix: "Edit",
    submitLabel: "Save changes",
  },
  customerDetailPage: {
    editLink: "Edit",
    deleteLink: "Delete",
    totalBookings: "Total bookings",
    cancelled: "Cancelled",
    cancellationRateSuffix: "% of bookings",
    noShows: "No-shows",
    totalSpent: "Total spent",
    honoredBookingsSuffix: "honored bookings",
    bookingsHeading: "Bookings",
  },
  vehiclesPage: {
    eyebrow: "Your fleet",
    title: "Vehicles",
    subtitle: "The buses, cars, and jeeps you can assign to departures.",
    newVehicleButton: "+ New vehicle",
    emptyTitle: "Your fleet is empty",
    emptyMessage: "Add a vehicle — a bus, car, or jeep — so you can assign it to departures.",
    inactiveSuffix: "(inactive)",
    editLink: "Edit",
    deactivate: "Deactivate",
    activate: "Activate",
    deleteLink: "Delete",
  },
  vehicleForm: {
    name: "Name",
    namePlaceholder: "e.g. Bus 1, Mercedes Sprinter",
    type: "Type",
    capacity: "Capacity (seats)",
    licensePlate: "License plate",
    driverName: "Driver name",
    driverPhone: "Driver phone",
    saving: "Saving…",
  },
  newVehiclePage: {
    title: "New vehicle",
    subtitle: "Add a bus, car, or jeep to assign to departures.",
    submitLabel: "Add vehicle",
  },
  editVehiclePage: {
    subtitle: "Refine the details of this vehicle.",
    submitLabel: "Save changes",
  },
  vehicleDetailPage: {
    editLink: "Edit",
    deactivatedWarning: "This vehicle is deactivated — it won't show up as an option when scheduling new departures.",
    upcomingDeparturesHeading: "Upcoming departures",
    emptyTitle: "No upcoming departures",
    emptyMessage: "Departures this vehicle is assigned to will show up here.",
  },
  staffPage: {
    eyebrow: "Your team",
    title: "Staff",
    subtitle: "Your agency's owner, operators, drivers, and guides.",
    newStaffButton: "+ New staff member",
    searchPlaceholder: "Search by name, email, or phone…",
    emptySearchTitle: "No staff match your search",
    emptySearchMessage: "Try a different name, email, or phone number.",
    youSuffix: "(you)",
    disabledBadge: "Disabled",
    attendanceLink: "Attendance",
    editLink: "Edit",
    activate: "Activate",
    disable: "Disable",
  },
  staffForm: {
    name: "Name",
    email: "Email",
    password: "Password",
    phone: "Phone",
    rolesLabel: "Roles",
    rolesHint: "Select one or more roles. The user chooses an active role after login.",
    operatorHint: "Day-to-day bookings, customers, tours — can't delete.",
    driverHint: "Can be assigned to departures as the driver.",
    guideHint: "Can be assigned to departures as the guide.",
    driverGuideHint: "Can be assigned to departures as the driver, the guide, or both — for tours where one person does both jobs.",
    saving: "Saving…",
  },
  newStaffPage: {
    title: "New staff member",
    subtitle: "Add an operator, driver, guide, or driver-guide to your team.",
    submitLabel: "Add staff member",
  },
  editStaffPage: {
    subtitle: "Update this staff member's details and role.",
    submitLabel: "Save changes",
  },
  attendancePage: {
    titleSuffix: "— attendance",
    daysWorkedSuffix: "day(s) worked,",
    absentInInfix: "absent in",
    backToStaff: "Back to staff",
    prev: "← Prev",
    next: "Next →",
    markWorkedPrefix: "Mark",
    markAbsentPrefix: "Mark",
    clear: "clear",
  },
  financesPage: {
    eyebrow: "Your books",
    title: "Finances",
    subtitle: "Revenue booked, payments collected, and what's still outstanding.",
    totalRevenue: "Total revenue",
    collected: "Collected",
    outstanding: "Outstanding",
    paymentsRecorded: "Payments recorded",
    byCurrency: "By currency",
    collectedOfInfix: "collected of",
    recentPayments: "Recent payments",
    emptyTitle: "No payments recorded yet",
    emptyMessage: "Payments you record against a booking will show up here.",
    void: "Void",
    byPaymentMethod: "By payment method",
    noPaymentsYet: "No payments yet.",
  },
  schedulePage: {
    eyebrow: "Your assignments",
    title: "My schedule",
    subtitle: "Tours you're driving or guiding.",
    emptyNoUpcomingTitle: "No upcoming assignments",
    emptyNoPastTitle: "No past assignments",
    emptyNoneTitle: "Nothing assigned yet",
    emptyMessage: "When you're assigned as a driver or guide on a departure, it shows up here.",
  },
  settingsPage: {
    eyebrow: "Your agency",
    title: "Settings",
    subtitle: "How your agency presents itself to travelers on the marketplace.",
  },
  orgSettingsForm: {
    agencyName: "Agency name",
    descriptionLabel: "Description (shown on your public page)",
    contactEmail: "Contact email",
    contactPhone: "Contact phone",
    publishedPrefix: "Published (your agency and its published tours appear on the public marketplace at /agencies/",
    publishedSuffix: ")",
    saved: "Saved.",
    saving: "Saving…",
    saveSettings: "Save settings",
  },
  loginPage: {
    title: "Log in",
    subtitle: "Use your agency or Super Admin credentials.",
    email: "Email",
    password: "Password",
    loggingIn: "Logging in…",
    submit: "Log in",
    footerNote: "Agency accounts are created by the platform administrator.",
    tooManyAttempts: "Too many attempts. Please wait a minute and try again.",
    invalidCredentials: "Invalid email or password.",
  },
  registerPage: {
    title: "Agency accounts are provisioned by GoNairi",
    message: "A platform administrator creates each travel agency and its Owner account. If your agency has already been created, use the credentials provided to you.",
    goToLogin: "Go to agency login",
  },
  publicLayout: {
    browseTours: "Browse tours",
    agencyLogin: "Agency login",
    footer: "GoNairi — tour booking & agency back-office for Armenia",
  },
  homePage: {
    heroTitleLine1: "Discover Armenia,",
    heroTitleLine2: "one tour at a time.",
    heroSubtitle: "Browse tours from local Armenian agencies — monasteries, mountains, wine and gastronomy — and book directly, no middleman.",
    browseToursButton: "Browse tours",
    featuredTours: "Featured tours",
  },
  toursSearchPage: {
    title: "Tours in Armenia",
    searchPlaceholder: "Search tours…",
    searchButton: "Search",
    noToursFound: "No tours found.",
    daySuffix: "d",
  },
  tourDetailPage: {
    byPrefix: "By",
    daysSuffix: "day(s)",
    perPaxSuffix: "/ pax",
    upcomingDeparturesHeading: "Upcoming departures",
    noUpcomingDepartures: "No upcoming departures scheduled.",
    seatsLeftSuffix: "seats left",
    fullyBooked: "Fully booked",
    bookButton: "Book",
  },
  agencyProfilePage: {
    toursHeading: "Tours",
    noPublishedTours: "No published tours yet.",
  },
  bookDeparturePage: {
    perPaxSuffix: "/ pax",
    fullyBookedMessage: "Sorry, this departure is fully booked.",
  },
  guestBookingForm: {
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    paxCountPrefix: "Pax count (max",
    specialRequests: "Special requests",
    booking: "Booking…",
    requestBooking: "Request booking",
  },
  guestBookingStatusPage: {
    title: "Booking confirmation",
    paxSuffix: "pax",
    statusPrefix: "Status:",
    paymentPrefix: "Payment:",
    contactMessagePrefix: "will contact you at",
    contactMessageSuffix: "to confirm payment and details. Keep this link to check your booking status later.",
  },
  notFoundPage: {
    pageNotFoundTitle: "Page not found",
    couldNotFindTitle: "We couldn't find that",
    message: "The page you're looking for doesn't exist, or may have been removed.",
    goHome: "Go home",
    backToDashboard: "Back to dashboard",
    backToRoles: "Back to roles",
  },
  errorBoundary: {
    title: "Something went wrong",
    snagWithRefPrefix: "We hit a snag loading this page (ref:",
    snagWithRefSuffix: ").",
    snagNoRef: "We hit a snag loading this page.",
    tryAgain: "Try again",
    goHome: "Go home",
    globalWithRefPrefix: "The app hit an unexpected error (ref:",
    globalWithRefSuffix: ").",
    globalNoRef: "The app hit an unexpected error.",
  },
};

export default en;
