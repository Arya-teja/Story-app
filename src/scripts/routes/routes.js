import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import LoginPage from "../pages/login/login-page";
import RegisterPage from "../pages/register/register-page";
import AddStoryPage from "../pages/add-story/add-story-page";
import FavoritesPage from "../pages/favorites/favorites-page";
import NotifyPage from "../pages/notify/notify-page";

const routes = {
  "/": new HomePage(),
  "/about": new AboutPage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add-story": new AddStoryPage(),
  "/favorites": new FavoritesPage(),
  "/notify": new NotifyPage(),
};

export default routes;
