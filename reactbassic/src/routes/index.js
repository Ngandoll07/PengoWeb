import HomePage from "../pages/HomePage/HomePage"
import PracticePage from "../pages/PracticeRead/PracticeRead"
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage"
import LoginPage from "../pages/LoginPage/LoginPage"
import MyProfilePage from "../pages/MyProfilePage/MyProfilePage"
import RoadmapPage from "../pages/RoadmapPage/RoadmapPage"
import SignupPage from "../pages/SignupPage/SignupPage";
import PracticeLisnRead from "../pages/PracticeLisnRead/PracticeLisnRead";
import PracticeListening from "../pages/PracticeListening/PracticeListening";
import PracticeRead from "../pages/PracticeRead/PracticeRead";
import ResultPage from "../pages/ResultPage/ResultPage";

import Dashboard from "../pages/Admin/AdminDashboard/Dashboard.jsx";
import AdminUser from "../pages/Admin/AdminUser/User";
import ReadingTopic from "../pages/Admin/ReadingTopic/ReadingTopic";
import ListeningTopic from "../pages/Admin/ListeningTopic/ListeningTopic";

export const routes = [
    {
        path: '/',
        page: HomePage,
        isShowHeader: true
    },
    {
        path: '/practice',
        page: PracticePage,
        isShowHeader: true
    },
    {
        path: '/login',
        page: LoginPage,
        isShowHeader: false
    },
    {
        path: '/profile',
        page: MyProfilePage,
        isShowHeader: true
    },
    {
        path: '/roadmap',
        page: RoadmapPage,
        isShowHeader: true
    },
    {
        path: '/signup',
        page: SignupPage,
        isShowHeader: false,
    },
    {
        path: '/practicelisnread',
        page: PracticeLisnRead,
        isShowHeader: true
    },
    {
        path: '/practicelistening',
        page: PracticeListening,
        isShowHeader: true
    },
    {
        path: '/practiceread',
        page: PracticeRead,
        isShowHeader: true
    },
    {
        path: '/result',
        page: ResultPage,
        isShowHeader: true
    },

    //  admin
    {
        path: '/admin',
        page: Dashboard,
    },
    {
        path: '/admin/manage_user',
        page: AdminUser,
    },
    {
        path: '/admin/readtopic',
        page: ReadingTopic,
    },
    {
        path: '*',
        page: NotFoundPage
    },
    {
        path: '/admin/listeningtopic',
        page: ListeningTopic,
    }
]