﻿using Microsoft.AspNetCore.Mvc;
using Tellma.Api;
using Tellma.Api.Base;
using Tellma.Model.Application;

namespace Tellma.Controllers
{
    [Route("api/emails")]
    [ApplicationController]
    [ApiVersion("1.0")]
    public class EmailsController : FactGetByIdControllerBase<EmailForQuery, int>
    {
        private readonly EmailsService _service;

        public EmailsController(EmailsService service)
        {
            _service = service;
        }

        protected override FactGetByIdServiceBase<EmailForQuery, int> GetFactGetByIdService()
        {
            return _service;
        }
    }
}