import React, { useState } from 'react';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { Sidebar, ScreenTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Core Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { HomeworkScreen } from './screens/HomeworkScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { CoursesScreen } from './screens/CoursesScreen';
import { StudyAssistantScreen } from './screens/StudyAssistantScreen';
import { NotesScreen } from './screens/NotesScreen';
import { QuizScreen } from './screens/QuizScreen';
import { StudyPlannerScreen } from './screens/StudyPlannerScreen';
import { OfficialResourcesScreen } from './screens/OfficialResourcesScreen';
import { StudySessionsScreen } from './screens/StudySessionsScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LandingScreen } from './screens/LandingScreen';

// Modals
import { NewTaskModal } from './components/modals/NewTaskModal';
import { AuthModal } from './components/modals/AuthModal';
import { GradeCalculatorModal } from './components/modals/GradeCalculatorModal';
import { EnrollCourseModal } from './components/modals/EnrollCourseModal';
import { QuickSearchModal } from './components/modals/QuickSearchModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { InstantQuizModal } from './components/modals/InstantQuizModal';
import { StudyMateAssistant } from './components/voice/StudyMateAssistant';
import { Assignment, Course, AssignmentStatus } from './types';

const MainAppContent: React.FC = () => {
  const { user } = useAcademic();
  const [currentTab, setCurrentTab] = useState<ScreenTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals state
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Assignment | null>(null);
  const [defaultNewTaskStatus, setDefaultNewTaskStatus] = useState<AssignmentStatus>('todo');

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [gradeModalCourse, setGradeModalCourse] = useState<Course | null>(null);

  const handleOpenNewTask = (status: AssignmentStatus = 'todo') => {
    setEditingTask(null);
    setDefaultNewTaskStatus(status);
    setIsNewTaskOpen(true);
  };

  const handleEditTask = (task: Assignment) => {
    setEditingTask(task);
    setIsNewTaskOpen(true);
  };

  const handleOpenGradeModal = (course: Course) => {
    setGradeModalCourse(course);
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Floating App Header */}
        <Header
          onOpenNewTask={() => handleOpenNewTask('todo')}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Dynamic Route Screen Canvas */}
        <main className="w-full pt-16 px-4 md:px-6 lg:px-8 flex-1">
          {currentTab === 'dashboard' && (
            <DashboardScreen
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenNewTask={() => handleOpenNewTask('todo')}
              onEditTask={handleEditTask}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          )}

          {currentTab === 'homework-tasks' && (
            <HomeworkScreen
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          )}

          {currentTab === 'weekly-calendar' && <CalendarScreen />}

          {currentTab === 'subjects-courses' && (
            <CoursesScreen
              onOpenEnrollModal={() => setIsEnrollOpen(true)}
              onOpenGradeModal={handleOpenGradeModal}
              onOpenNewTaskForCourse={(_courseTitle) => handleOpenNewTask('todo')}
            />
          )}

          {currentTab === 'study-assistant' && <StudyAssistantScreen />}

          {currentTab === 'ai-notes' && <NotesScreen />}

          {currentTab === 'quiz-practice' && <QuizScreen />}

          {currentTab === 'study-planner' && (
            <StudyPlannerScreen onNavigate={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'official-resources' && <OfficialResourcesScreen />}

          {currentTab === 'study-sessions-timer' && <StudySessionsScreen />}

          {currentTab === 'analytics-insights' && <AnalyticsScreen />}

          {currentTab === 'settings' && (
            <SettingsScreen 
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenOnboarding={() => setIsOnboardingOpen(true)} 
            />
          )}

          {currentTab === 'landing' && (
            <LandingScreen
              onEnterApp={(tab) => setCurrentTab(tab || 'dashboard')}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => {
          setIsNewTaskOpen(false);
          setEditingTask(null);
        }}
        initialTask={editingTask}
        defaultStatus={defaultNewTaskStatus}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <GradeCalculatorModal
        isOpen={Boolean(gradeModalCourse)}
        onClose={() => setGradeModalCourse(null)}
        course={gradeModalCourse}
      />

      <EnrollCourseModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
      />

      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen || !user.onboarding_completed}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <InstantQuizModal />

      <StudyMateAssistant />
    </div>
  );
};

export default function App() {
  return (
    <AcademicProvider>
      <MainAppContent />
    </AcademicProvider>
  );
}
