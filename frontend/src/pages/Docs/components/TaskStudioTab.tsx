import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const TaskStudioTab = (): JSX.Element => {
  return (
    <Box>
      <Typography
        variant="h3"
        sx={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#ffffff',
          mb: 3,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Task Studio
      </Typography>

      <Typography
        sx={{
          fontSize: '1.1rem',
          color: '#a1a1aa',
          mb: 4,
          lineHeight: 1.6,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Task Studio is Banbury's comprehensive task management interface that allows you to create, schedule, monitor, and manage tasks within your workspace. It provides powerful features for both individual and recurring task management.
      </Typography>

      {/* Getting Started Section */}
      <Paper
        sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 4,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 3,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Getting Started
        </Typography>

        <Typography
          sx={{
            fontSize: '1rem',
            color: '#a1a1aa',
            mb: 3,
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          To access Task Studio, you need to be logged into your Banbury account. Once authenticated, you can navigate to Task Studio through the sidebar navigation.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Access Requirements:
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Valid Banbury account with authentication"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Active session with proper permissions"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
          </List>
        </Box>
      </Paper>

      {/* Core Features Section */}
      <Paper
        sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 4,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 3,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Core Features
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Task Creation &amp; Scheduling
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              color: '#a1a1aa',
              mb: 2,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Create tasks with detailed information including titles, descriptions, scheduled dates and times, priority levels, and estimated duration. The task scheduler supports both one-time and recurring tasks.
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Task title and description"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Date and time scheduling with datetime picker"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Priority levels: Urgent, High, Medium, Low"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Estimated duration tracking"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Tag system for organization"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Recurring Tasks
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              color: '#a1a1aa',
              mb: 2,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Set up recurring tasks with flexible patterns and end dates. Perfect for routine activities and regular workflows.
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Daily, Weekly, and Monthly recurring patterns"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Configurable end dates for recurring series"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Automatic task generation based on patterns"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Safety limits to prevent excessive task creation"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Task Management &amp; Monitoring
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              color: '#a1a1aa',
              mb: 2,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Monitor and manage your tasks through a comprehensive table interface with filtering, status management, and batch operations.
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Real-time task status tracking (Scheduled, Running, Completed, Cancelled)"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Filter tasks by status for focused views"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Batch selection and bulk delete operations"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Individual task actions (Start, Complete, Cancel, Delete)"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Task results and error tracking"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
          </List>
        </Box>
      </Paper>

      {/* Interface Overview Section */}
      <Paper
        sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 4,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 3,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Interface Overview
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Navigation Sidebar
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              color: '#a1a1aa',
              mb: 2,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            The left sidebar provides quick access to all major sections including Dashboard, Workspaces, Task Studio, Knowledge, and Settings. The Task Studio icon (workflow symbol) is prominently displayed for easy navigation.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Main Task Table
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              color: '#a1a1aa',
              mb: 2,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            The central area displays all your tasks in a comprehensive table format with columns for selection, title, status, priority, scheduled time, duration, results, and actions. Filter buttons allow you to view tasks by status.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Task Creation Panel
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              color: '#a1a1aa',
              mb: 2,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Click the "Create Task" button to open the slide-out task creation panel on the right side. This panel contains all the forms and options needed to create new tasks, including recurring task settings.
          </Typography>
        </Box>
      </Paper>

      {/* How to Use Section */}
      <Paper
        sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 4,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 3,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          How to Use Task Studio
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Creating a New Task
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="1. Click the 'Create Task' button in the top-right corner"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="2. Fill in the task title (required) and description"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="3. Set the scheduled date and time using the datetime picker"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="4. Choose priority level and estimated duration"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="5. Add tags for organization (comma-separated)"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="6. Optionally enable recurring tasks and set pattern"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="7. Click 'Schedule Task' or 'Create Recurring Tasks'"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Managing Existing Tasks
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Use filter buttons to view tasks by status (All, Scheduled, Running, Completed)"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Click 'Start' to begin a scheduled task"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Click 'Complete' to mark a running task as finished"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Use 'Cancel' to stop a task before completion"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Select multiple tasks using checkboxes for batch operations"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="• Use 'Delete Selected' for bulk removal of tasks"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Setting Up Recurring Tasks
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="1. Check the 'Create recurring tasks' checkbox in the task creation form"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="2. Select a repeat pattern: Daily, Weekly, or Monthly"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="3. Set an end date for the recurring series"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText
                primary="4. The system will automatically generate all tasks in the series"
                primaryTypographyProps={{
                  sx: { fontSize: '0.95rem', color: '#a1a1aa' }
                }}
              />
            </ListItem>
          </List>
        </Box>
      </Paper>

      {/* Status Badges Section */}
      <Paper
        sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 4,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 3,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Understanding Status and Priority Badges
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Task Status Indicators
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip label="Scheduled" variant="outlined" sx={{ color: '#a1a1aa', borderColor: '#a1a1aa' }} />
            <Chip label="Running" sx={{ backgroundColor: '#3b82f6', color: 'white' }} />
            <Chip label="Completed" variant="outlined" sx={{ color: '#10b981', borderColor: '#10b981' }} />
            <Chip label="Cancelled" sx={{ backgroundColor: '#ef4444', color: 'white' }} />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ffffff',
              mb: 2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Priority Levels
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip label="Urgent" sx={{ backgroundColor: '#ef4444', color: 'white' }} />
            <Chip label="High" sx={{ backgroundColor: '#3b82f6', color: 'white' }} />
            <Chip label="Medium" variant="outlined" sx={{ color: '#a1a1aa', borderColor: '#a1a1aa' }} />
            <Chip label="Low" variant="outlined" sx={{ color: '#6b7280', borderColor: '#6b7280' }} />
          </Box>
        </Box>
      </Paper>

      {/* Best Practices Section */}
      <Paper
        sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 4,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 3,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Best Practices
        </Typography>

        <List sx={{ pl: 2 }}>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText
              primary="• Use descriptive task titles that clearly indicate the work to be done"
              primaryTypographyProps={{
                sx: { fontSize: '0.95rem', color: '#a1a1aa' }
              }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText
              primary="• Set realistic estimated durations to help with planning"
              primaryTypographyProps={{
                sx: { fontSize: '0.95rem', color: '#a1a1aa' }
              }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText
              primary="• Use tags consistently to organize related tasks"
              primaryTypographyProps={{
                sx: { fontSize: '0.95rem', color: '#a1a1aa' }
              }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText
              primary="• Regularly review and update task statuses to maintain accuracy"
              primaryTypographyProps={{
                sx: { fontSize: '0.95rem', color: '#a1a1aa' }
              }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText
              primary="• Use recurring tasks for routine activities to save time"
              primaryTypographyProps={{
                sx: { fontSize: '0.95rem', color: '#a1a1aa' }
              }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText
              primary="• Set appropriate end dates for recurring tasks to avoid clutter"
              primaryTypographyProps={{
                sx: { fontSize: '0.95rem', color: '#a1a1aa' }
              }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemText
              primary="• Use batch operations to efficiently manage multiple tasks"
              primaryTypographyProps={{
                sx: { fontSize: '0.95rem', color: '#a1a1aa' }
              }}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default TaskStudioTab;
