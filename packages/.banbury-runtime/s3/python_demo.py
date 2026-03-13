#!/usr/bin/env python3
"""
Basic Python Script - Demonstration of Common Programming Concepts
Author: AI Assistant
Date: 2024
"""

import random
import math
from datetime import datetime

def greet_user():
    """Simple greeting function"""
    name = input("What's your name? ")
    print(f"Hello, {name}! Welcome to this Python demo.")
    return name

def number_guessing_game():
    """A simple number guessing game"""
    print("\n--- Number Guessing Game ---")
    secret_number = random.randint(1, 100)
    attempts = 0
    max_attempts = 7
    
    print(f"I'm thinking of a number between 1 and 100. You have {max_attempts} attempts!")
    
    while attempts < max_attempts:
        try:
            guess = int(input(f"Attempt {attempts + 1}: Enter your guess: "))
            attempts += 1
            
            if guess == secret_number:
                print(f"🎉 Congratulations! You guessed it in {attempts} attempts!")
                return True
            elif guess < secret_number:
                print("Too low! Try a higher number.")
            else:
                print("Too high! Try a lower number.")
                
        except ValueError:
            print("Please enter a valid number!")
            attempts += 1
    
    print(f"Game over! The number was {secret_number}.")
    return False

def calculate_circle_stats(radius):
    """Calculate area and circumference of a circle"""
    area = math.pi * radius ** 2
    circumference = 2 * math.pi * radius
    return area, circumference

def fibonacci_sequence(n):
    """Generate Fibonacci sequence up to n terms"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    
    return fib

def word_counter(text):
    """Count words and characters in text"""
    words = text.split()
    word_count = len(words)
    char_count = len(text)
    char_count_no_spaces = len(text.replace(' ', ''))
    
    return {
        'words': word_count,
        'characters': char_count,
        'characters_no_spaces': char_count_no_spaces
    }

def display_menu():
    """Display the main menu"""
    print("\n" + "="*50)
    print("         PYTHON DEMO SCRIPT MENU")
    print("="*50)
    print("1. Number Guessing Game")
    print("2. Circle Calculator")
    print("3. Fibonacci Sequence")
    print("4. Word Counter")
    print("5. Random Quote")
    print("6. Current Date & Time")
    print("0. Exit")
    print("="*50)

def get_random_quote():
    """Return a random inspirational quote"""
    quotes = [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Life is what happens to you while you're busy making other plans. - John Lennon",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        "It is during our darkest moments that we must focus to see the light. - Aristotle",
        "The only impossible journey is the one you never begin. - Tony Robbins"
    ]
    return random.choice(quotes)

def main():
    """Main function to run the program"""
    print("🐍 Welcome to the Basic Python Script Demo! 🐍")
    
    # Greet the user
    user_name = greet_user()
    
    while True:
        display_menu()
        
        try:
            choice = input("\nEnter your choice (0-6): ").strip()
            
            if choice == '0':
                print(f"\nGoodbye, {user_name}! Thanks for using the Python demo! 👋")
                break
            
            elif choice == '1':
                number_guessing_game()
            
            elif choice == '2':
                try:
                    radius = float(input("\nEnter the radius of the circle: "))
                    area, circumference = calculate_circle_stats(radius)
                    print(f"\nCircle with radius {radius}:")
                    print(f"Area: {area:.2f}")
                    print(f"Circumference: {circumference:.2f}")
                except ValueError:
                    print("Please enter a valid number for radius!")
            
            elif choice == '3':
                try:
                    n = int(input("\nHow many Fibonacci numbers to generate? "))
                    fib_sequence = fibonacci_sequence(n)
                    print(f"\nFirst {n} Fibonacci numbers:")
                    print(fib_sequence)
                except ValueError:
                    print("Please enter a valid integer!")
            
            elif choice == '4':
                text = input("\nEnter some text to analyze: ")
                stats = word_counter(text)
                print(f"\nText Analysis:")
                print(f"Words: {stats['words']}")
                print(f"Characters (with spaces): {stats['characters']}")
                print(f"Characters (without spaces): {stats['characters_no_spaces']}")
            
            elif choice == '5':
                quote = get_random_quote()
                print(f"\n💭 Random Quote: {quote}")
            
            elif choice == '6':
                now = datetime.now()
                print(f"\n📅 Current Date & Time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"📅 Formatted: {now.strftime('%A, %B %d, %Y at %I:%M %p')}")
            
            else:
                print("\n❌ Invalid choice! Please select a number from 0-6.")
        
        except KeyboardInterrupt:
            print(f"\n\nProgram interrupted. Goodbye, {user_name}! 👋")
            break
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")

if __name__ == "__main__":
    main()