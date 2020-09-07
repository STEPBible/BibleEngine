import { RouteConfig } from 'vue-router';

const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
  {
    path: '/references',
    name: 'References',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../pages/References.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../pages/Search.vue')
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:passage',
    name: 'Bible',
    component: () => import('../pages/Home.vue'),
    props: true
  }
];

export default routes;
