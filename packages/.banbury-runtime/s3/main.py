#!/usr/bin/env python3
"""
Enhanced Hello World Script
A simple greeting program with additional features
"""

import datetime

def greet_user(name=None):
    """Greet the user with a personalized message"""
    if name:
        return f"Hello, {name}! Welcome to Python programming!"
    else:
        return "Hello, World! Welcome to Python programming!"

def get_current_time():
    """Get the current date and time"""
    now = datetime.datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")

def display_separator(char="=", length=50):
    """Display a decorative separator"""
    print(char * length)

def main():
    """Main function to run the enhanced Hello World program"""
    display_separator()
    print("🌟 Enhanced Hello World Program 🌟")
    display_separator()
    
    # Basic greeting
    print(greet_user())
    
    # Get user's name
    try:
        user_name = input("\nWhat's your name? (Press Enter to skip): ").strip()
        if user_name:
            print(greet_user(user_name))
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
        return
    
    # Display current time
    print(f"\nCurrent time: {get_current_time()}")
    
    # Some fun facts
    print("\n📚 Fun Python Facts:")
    print("• Python was created by Guido van Rossum")
    print("• Python is named after Monty Python's Flying Circus")
    print("• Python emphasizes code readability")
    
    display_separator()
    print("Thanks for running this enhanced Hello World script!")
    display_separator()

if __name__ == "__main__":
    main()# main.py
