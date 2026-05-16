export const routes = {
  login: "/login",
  register: "/register",
  spot: "/spot",
  futures: "/future",
  orders: "/orders",
  history: "/history",
  position: "/position",
  balance: "/balance",
  portfolio: "/portfolio",
  vault: "/vault",
} as const;

export const primaryNavRoutes = [
  { href: routes.spot, label: "Spot" },
  { href: routes.futures, label: "Futures" },
  { href: routes.balance, label: "Balance" },
  { href: routes.portfolio, label: "Portfolio" },
  { href: routes.vault, label: "Vault" },
] as const;

export const protectedRoutes = [
  routes.spot,
  routes.futures,
  routes.portfolio,
  routes.vault,
  routes.orders,
  routes.history,
  routes.position,
  routes.balance,
] as const;
