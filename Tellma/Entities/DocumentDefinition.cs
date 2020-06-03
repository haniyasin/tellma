﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tellma.Entities
{
    [EntityDisplay(Singular = "DocumentDefinition", Plural = "DocumentDefinitions")]
    public class DocumentDefinitionForSave<TDocumentDefinitionLineDefinition, TDocumentDefinitionMarkupTemplate> : EntityWithKey<int>
    {
        [Display(Name = "Code")]
        [Required]
        [StringLength(255)]
        [AlwaysAccessible]
        public string Code { get; set; }

        public bool? IsOriginalDocument { get; set; }

        [MultilingualDisplay(Name = "TitleSingular", Language = Language.Primary)]
        [StringLength(255)]
        [AlwaysAccessible]
        public string TitleSingular { get; set; }

        [MultilingualDisplay(Name = "TitleSingular", Language = Language.Secondary)]
        [StringLength(255)]
        [AlwaysAccessible]
        public string TitleSingular2 { get; set; }

        [MultilingualDisplay(Name = "TitleSingular", Language = Language.Ternary)]
        [StringLength(255)]
        [AlwaysAccessible]
        public string TitleSingular3 { get; set; }

        [MultilingualDisplay(Name = "TitlePlural", Language = Language.Primary)]
        [Required]
        [StringLength(255)]
        [AlwaysAccessible]
        public string TitlePlural { get; set; }

        [MultilingualDisplay(Name = "TitlePlural", Language = Language.Secondary)]
        [StringLength(255)]
        [AlwaysAccessible]
        public string TitlePlural2 { get; set; }

        [MultilingualDisplay(Name = "TitlePlural", Language = Language.Ternary)]
        [StringLength(255)]
        [AlwaysAccessible]
        public string TitlePlural3 { get; set; }
        public string Prefix { get; set; }
        public byte? CodeWidth { get; set; }

        // New Stuff
        public string MemoVisibility { get; set; }
        public string ClearanceVisibility { get; set; }

        // End: New stuff

        [Display(Name = "MainMenuIcon")]
        [StringLength(255)]
        [AlwaysAccessible]
        public string MainMenuIcon { get; set; }

        [Display(Name = "MainMenuSection")]
        [StringLength(255)]
        [AlwaysAccessible]
        public string MainMenuSection { get; set; }

        [Display(Name = "MainMenuSortKey")]
        [AlwaysAccessible]
        public decimal? MainMenuSortKey { get; set; }

        [ForeignKey(nameof(DocumentDefinitionLineDefinition.DocumentDefinitionId))]
        public List<TDocumentDefinitionLineDefinition> LineDefinitions { get; set; }

        [ForeignKey(nameof(DocumentDefinitionMarkupTemplate.DocumentDefinitionId))]
        public List<TDocumentDefinitionMarkupTemplate> MarkupTemplates { get; set; }
    }

    public class DocumentDefinitionForSave : DocumentDefinitionForSave<DocumentDefinitionLineDefinitionForSave, DocumentDefinitionMarkupTemplateForSave>
    {

    }

    public class DocumentDefinition : DocumentDefinitionForSave<DocumentDefinitionLineDefinition, DocumentDefinitionMarkupTemplate>
    {
        [Display(Name = "ModifiedBy")]
        public int? SavedById { get; set; }

        public bool? CanReachState1 { get; set; }
        public bool? CanReachState2 { get; set; }
        public bool? CanReachState3 { get; set; }
        public bool? HasWorkflow { get; set; }

        // For Query

        [Display(Name = "ModifiedBy")]
        [ForeignKey(nameof(SavedById))]
        public User SavedBy { get; set; }
    }
}
