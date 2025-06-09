import HomePage from "../pages/HomePage/HomePage"
import PracticePage from "../pages/PracticePage/PracticePage"
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage"
import LoginPage from "../pages/LoginPage/LoginPage"
import MyProfilePage from "../pages/MyProfilePage/MyProfilePage"
import RoadmapPage from "../pages/RoadmapPage/RoadmapPage"

export const routes=[ 
    {
        path:'/',
        page: HomePage,
        isShowHeader:true
    },
    {
        path:'/practice',
        page: PracticePage,
        isShowHeader:true
    },
    {
        path:'/login',
        page: LoginPage,
        isShowHeader:false
    },
    {
        path:'/profile',
        page: MyProfilePage,
        isShowHeader:true
    },
    {
        path:'/roadmap',
        page: RoadmapPage,
        isShowHeader:true
    },
    {
        path:'*',
        page: NotFoundPage
    }
]