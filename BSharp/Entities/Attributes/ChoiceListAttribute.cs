﻿using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace BSharp.Entities
{
    /// <summary>
    /// Indicates that the adorned property must have one of the specified values
    /// Custom validation attribute, checks whether the value is one
    /// of a specified list of choices, and 
    /// </summary>
    [AttributeUsage(validOn: AttributeTargets.Property)]
    public class ChoiceListAttribute : ValidationAttribute
    {
        public object[] Choices { get; }
        public string[] DisplayNames { get; }

        public ChoiceListAttribute(object[] choices, string[] displayNames = null)
        {
            Choices = choices ?? throw new ArgumentNullException(nameof(choices));
            DisplayNames = displayNames ?? choices.Select(e => e.ToString()).ToArray();

            if(Choices.Any(e => string.IsNullOrEmpty(e?.ToString())))
            {
                // Programmer error
                throw new ArgumentException($"One of the choices cannot be blank");
            }

            if(Choices.Length != DisplayNames.Length)
            {
                // Programmer error
                throw new ArgumentException($"There are {Choices.Length} choices and {DisplayNames.Length} display names");
            }

            if(Choices.Length == 0)
            {
                // Programmer error
                throw new ArgumentException("At least one choice is required");
            }
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            // If it doesn't match any of the choices => error
            if (!string.IsNullOrWhiteSpace(value?.ToString()) && !Choices.Contains(value))
            {
                string concatenatedChoices = string.Join(", ", Choices.Select(e => e.ToString()));

                // This is a programmer error, no need to localize it
                return new ValidationResult($"Only the following values are allowed: {concatenatedChoices}");
            }

            // All is good
            return ValidationResult.Success;
        }
    }
}
