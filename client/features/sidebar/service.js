let sidebarInstance = null;

export function setSidebarInstance(instance) {
  sidebarInstance = instance || null;
}

export function getSidebarInstance() {
  return sidebarInstance;
}

export function clearSidebarInstance(instance) {
  if (!instance || sidebarInstance === instance) {
    sidebarInstance = null;
  }
}

