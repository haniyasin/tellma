﻿using System;

namespace Tellma.Api.Metadata
{
    /// <summary>
    /// Carries information about an entity property that override its default metadata.
    /// </summary>
    public class PropertyMetadataOverrides
    {
        /// <summary>
        /// Overrides the default display function of the property, or if null removes the property metadata entirely.
        /// </summary>
        public Func<string> Display { get; set; }

        /// <summary>
        /// Indicates that the entity property is required.
        /// </summary>
        public bool IsRequired { get; set; }

        /// <summary>
        /// For navigation properties, this specifies the target definition Id.
        /// </summary>
        public int? DefinitionId { get; set; }
    }
}
