﻿using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

namespace Tellma.Services.Instrumentation
{
    /// <summary>
    /// Represents the measured time of a named section of code
    /// </summary>
    public class CodeBlockInstrumentation
    {
        /// <summary>
        /// For fast retrieval
        /// </summary>
        private readonly Dictionary<string, CodeBlockInstrumentation> _dic = new Dictionary<string, CodeBlockInstrumentation>();

        /// <summary>
        ///  Ordered
        /// </summary>
        private List<CodeBlockInstrumentation> _breakdown = null;

        /// <summary>
        /// The total time this section took. Kept short for smaller response size
        /// </summary>
        [JsonProperty(Order = 1)]
        public long T { get; set; } = 0;

        /// <summary>
        /// The name of this section. Kept short for smaller response size
        /// </summary>
        [JsonProperty(Order = 2)]
        public string N { get; set; }

        /// <summary>
        /// The instrumented blocks that took at least 1 millisecond. Name kept short for smaller response size
        /// </summary>
        [JsonProperty(Order = 3)]
        public IEnumerable<CodeBlockInstrumentation> B => _breakdown?.Where(e => e.T != 0);

        /// <summary>
        /// Adds a step with the specified name
        /// </summary>
        /// <param name="name">The name of the step</param>
        public CodeBlockInstrumentation AddSubBlock(string name)
        {
            if (!_dic.TryGetValue(name, out CodeBlockInstrumentation instrumentation))
            {
                instrumentation = new CodeBlockInstrumentation { N = name };
                _dic.Add(name, instrumentation);

                // Add to the breakdown
                _breakdown ??= new List<CodeBlockInstrumentation>();
                _breakdown.Add(instrumentation);
            }

            return instrumentation;
        }
    }
}