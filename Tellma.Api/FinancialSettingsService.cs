﻿using Microsoft.Extensions.Localization;
using System;
using System.Threading;
using System.Threading.Tasks;
using Tellma.Api.Dto;
using Tellma.Model.Application;
using Tellma.Repository.Common;

namespace Tellma.Api
{
    public class FinancialSettingsService : ApplicationSettingsServiceBase<FinancialSettingsForSave, FinancialSettings>
    {
        private readonly IStringLocalizer _localizer;

        public FinancialSettingsService(
            ApplicationSettingsServiceDependencies deps,
            IStringLocalizer<Strings> localizer) : base(deps)
        {
            _localizer = localizer;
        }

        protected override string View => "financial-settings";

        protected override async Task<FinancialSettings> GetExecute(SelectExpandArguments args, CancellationToken cancellation)
        {
            var ctx = new QueryContext(UserId, Today);
            var settings = await Repository.FinancialSettings
                .Select(args.Select)
                .Expand(args.Expand)
                .OrderBy("FinancialModifiedById")
                .FirstOrDefaultAsync(ctx, cancellation);

            if (settings == null)
            {
                // Programmer mistake
                throw new InvalidOperationException("Bug: Settings have not been initialized.");
            }

            return settings;
        }

        protected override Task<FinancialSettingsForSave> SavePreprocess(FinancialSettingsForSave settingsForSave)
        {
            // Defaults
            settingsForSave.ArchiveDate ??= new DateTime(1900, 1, 1);
            settingsForSave.FreezeDate ??= new DateTime(1900, 1, 1);
            settingsForSave.FirstDayOfPeriod ??= 25;

            return base.SavePreprocess(settingsForSave);
        }

        protected override async Task SaveExecute(FinancialSettingsForSave settingsForSave, SelectExpandArguments args)
        {
            // Make sure the archive date is not in the future
            if (settingsForSave.ArchiveDate != null && settingsForSave.ArchiveDate.Value > DateTime.Today.AddDays(1))
            {
                ModelState.AddError(nameof(settingsForSave.ArchiveDate),
                    _localizer["Error_DateCannotBeInTheFuture"]);
            }

            // Make sure the archive date is not in the future
            if (settingsForSave.FreezeDate != null && settingsForSave.FreezeDate.Value > DateTime.Today.AddDays(1))
            {
                ModelState.AddError(nameof(settingsForSave.FreezeDate),
                    _localizer["Error_DateCannotBeInTheFuture"]);
            }

            // Persist
            var result = await Repository.FinancialSettings__Save(
                    settingsForSave: settingsForSave,
                    validateOnly: ModelState.IsError,
                    top: ModelState.RemainingErrors,
                    userId: UserId);

            AddLocalizedErrors(result.Errors, _localizer);
            ModelState.ThrowIfInvalid();
        }
    }
}
