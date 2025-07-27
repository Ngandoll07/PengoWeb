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
import CoursesPage from "../pages/CoursesPage/CoursesPage.jsx";
import CartPage from "../pages/CartPage/CartPage.jsx";
import DoTestPage from "../pages/DoTestPage/DoTestPage";
import PracticeLessonPage from "../pages/PracticeLessonPage/PracticeLessonPage";
import PracticeReadingPage from "../pages/PracticeLessonPage/PracticeReadingPage.jsx";
import MyCourses from "../pages/MyCourses/MyCourses";
import LoadingResultPage from "../pages/LoadingResultPage/LoadingResultPage";
import PracticeWriting from "../pages/PracticeWriting/PracticeWriting";
 
import Dashboard from "../pages/Admin/AdminDashboard/Dashboard.jsx";
import AdminUser from "../pages/Admin/AdminUser/User";
import ReadingTopic from "../pages/Admin/ReadingTopic/ReadingTopic";
import WritingTopic from "../pages/Admin/WritingTopic/WritingTopic"
import RoadmapAdminPage from "../pages/Admin/RoadmapAdminPage/RoadmapAdminPage";
import AdminUserRoadmap from "../pages/Admin/RoadmapAdminPage/AdminUserRoadmap.jsx";
import ExamResultPage from "../pages/Admin/ExamResultPage/ExamResultPage";

import UploadLessonPage from "../pages/Admin/UploadLessonPage/UploadLessonPage.jsx"
import ListeningTopic from "../pages/Admin/ListeningTopic/ListeningTopic";
import CourseAdmin from "../pages/Admin/CourseAdmin/CourseAdmin";
import AdminOrders from "../pages/Admin/AdminOrders/AdminOrders";



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
    {
        path: '/coursespage',
        page: CoursesPage,
        isShowHeader: true
    },
    {
        path: '/cartpage',
        page: CartPage,
        isShowHeader: true
    },
    {
        path: '/dotest',
        page: DoTestPage,
        isShowHeader: true
    },
    {
        path: '/practicelesson/:id',
        page: PracticeLessonPage,
        isShowHeader: true
    },

    {
        path: '/mycourses',
        page: MyCourses,
        isShowHeader: true
    },
     {
        path: '/loading',
        page: LoadingResultPage,
        isShowHeader: true
    },
   {
        path: '/practice-reading',
        page: PracticeReadingPage,
        isShowHeader: true
    },
       {
        path: '/practicewrite',
        page: PracticeWriting,
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
        path:'/admin/writingtopic',
        page: WritingTopic,
    },
    {
        path: '/admin/lesson',
        page: UploadLessonPage,
    },
    {
        path: '*',
        page: NotFoundPage
    },
    {
        path: '/admin/listeningtopic',
        page: ListeningTopic,
    },
    {
        path: "/admin/courseadmin",
        page: CourseAdmin,
    },
    {
        path: "/admin/orders",
        page: AdminOrders,
    },
    {
        path: "/admin/roadmap",
        page: RoadmapAdminPage,
    },
     {
        path: "/admin/examresult",
        page: ExamResultPage,
    },
    {
        path: "/admin/roadmaps/:userId",
        page: AdminUserRoadmap,
    }

]
