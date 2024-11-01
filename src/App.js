import React, { useState, useEffect } from 'react';

// 필터 함수들
const filterUsedProblem = usedProblemMap => problem => {
  return !usedProblemMap.has(problem.id);
};

const filterUnitUsedProblem = usedUnitMap => problem => {
  return !usedUnitMap.has(problem.unitId);
};

const filterUsedAndCompanionProblem = (usedProblemMap, companionUsedProblemMap) => problem =>
  !usedProblemMap.has(problem.id) && !companionUsedProblemMap.has(problem.id);

// 랜덤 숫자 생성 함수
const getRandomNum = () => 0;

export default function ProblemFilterVisualizer() {
  const [publishedProblems] = useState([
    [
      {
        id: 1001,
        unitId: 100,
        status: "",
        publishType: "D"
      },
      {
        id: 1002,
        unitId: 100,
        status: "",
        publishType: "D"
      },
      {
        id: 1003,
        unitId: 100,
        status: "",
        publishType: "D"
      }
    ],
    [
      {
        id: 2001,
        unitId: 200,
        status: "",
        publishType: "D"
      },
      {
        id: 2002,
        unitId: 200,
        status: "",
        publishType: "D"
      }
    ],
    [
      {
        id: 3001,
        unitId: 300,
        status: "",
        publishType: "D"
      },
      {
        id: 3002,
        unitId: 300,
        status: "",
        publishType: "D"
      }
    ]
  ]);

  const [usedProblemMap, setUsedProblemMap] = useState(new Map());
  const [companionUsedProblemMap, setCompanionUsedProblemMap] = useState(new Map());
  const [primaryResult, setPrimaryResult] = useState(null);
  const [lessonResult, setLessonResult] = useState(null);
  const [secondaryResult, setSecondaryResult] = useState(null);
  
  const [context] = useState({
    perGroupLimit: 3
  });

  function filterProblems(context, publishedProblems, companionUsedProblemMap, beforeUsedProblemMap, filterFn) {
    const unchosenProblems = [];
    const usedProblemMap = new Map(beforeUsedProblemMap);
    const randomizedProblems = publishedProblems.reduce((acc, problems) => {
      const filtered = problems.filter(filterFn(usedProblemMap, companionUsedProblemMap));
      if (filtered.length === 0) {
        // 만약 이미 출제된 문제들만 포함되어 있는 경우 건너뛴다
        return acc;
      }
      const selectedIndex = Math.floor(getRandomNum() * filtered.length);
      const [chosenProblem] = filtered.splice(selectedIndex, 1);
      unchosenProblems.push(...filtered); // 선택된 문제 제외하고 나머지 문제들
      usedProblemMap.set(chosenProblem.id, chosenProblem);
      acc.push(chosenProblem);
      return acc;
    }, []);
    return { randomizedProblems, unchosenProblems };
  }

  function filterProblemsNew(context, publishedProblems, companionUsedProblemMap, beforeUsedProblemMap, filterFn) {
    const unchosenProblems = [];
    const usedUnitMap = [...beforeUsedProblemMap].map(([,value]) => value).reduce((acc, problem) => {
      acc.set(problem.unitId, problem);
      return acc;
    }, new Map());
    const usedProblemMap = new Map(beforeUsedProblemMap);

    const randomizedProblems = publishedProblems.reduce((acc, problems) => {
      const unitFilteredProblems = problems.filter(filterUnitUsedProblem(usedUnitMap));
      const filtered = unitFilteredProblems.filter(filterFn(usedProblemMap, companionUsedProblemMap));

      if (filtered.length === 0) {
        return acc;
      }
      const selectedIndex = Math.floor(getRandomNum() * filtered.length);
      const [chosenProblem] = filtered.splice(selectedIndex, 1);
      unchosenProblems.push(...filtered);
      usedProblemMap.set(chosenProblem.id, chosenProblem);
      usedUnitMap.set(chosenProblem.unitId, chosenProblem);
      acc.push(chosenProblem);
      return acc;
    }, []);
    return { randomizedProblems, unchosenProblems };
  }

  function filterLessonProblems(context, publishedProblems, companionUsedProblemMap, usedProblemMap) {
    const { randomizedProblems, unchosenProblems } = filterProblems(
      context,
      publishedProblems,
      companionUsedProblemMap,
      usedProblemMap,
      filterUsedProblem
    );
    randomizedProblems.push(...unchosenProblems);
    return randomizedProblems.slice(0, context.perGroupLimit);
  }

  function filterSecondaryLessonProblems(context, publishedProblems, companionUsedProblemMap, usedProblemMap) {
    const { randomizedProblems, unchosenProblems } = filterProblems(
      context,
      publishedProblems,
      companionUsedProblemMap,
      usedProblemMap,
      filterUsedAndCompanionProblem
    );
    randomizedProblems.push(...unchosenProblems);
    return randomizedProblems.slice(0, context.perGroupLimit);
  }

  const [filterType, setFilterType] = useState('basic'); 

  useEffect(() => {
    const primaryResult = filterType === 'basic' 
      ? filterProblems(
          {},
          publishedProblems,
          companionUsedProblemMap,
          usedProblemMap,
          filterUsedAndCompanionProblem
        )
      : filterProblemsNew(
          {},
          publishedProblems,
          companionUsedProblemMap,
          usedProblemMap,
          filterUsedAndCompanionProblem
        );
    setPrimaryResult(primaryResult);

    // Lesson Problems Result
    const lessonProblems = filterLessonProblems(
      context,
      publishedProblems,
      companionUsedProblemMap,
      usedProblemMap
    );
    setLessonResult(lessonProblems);

    // Secondary Lesson Result
    const secondaryProblems = filterSecondaryLessonProblems(
      context,
      publishedProblems,
      companionUsedProblemMap,
      usedProblemMap
    );
    setSecondaryResult(secondaryProblems);
  }, [usedProblemMap, companionUsedProblemMap, publishedProblems, context, filterType]);

  const FilterTypeToggle = () => (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Filter Type</h2>
      <div className="flex space-x-4">
        <button
          onClick={() => setFilterType('basic')}
          className={`px-3 py-1.5 rounded-lg flex-1 ${
            filterType === 'basic'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Basic Filter
          <div className="text-xs">
            {filterType === 'basic' && '(No unit restrictions)'}
          </div>
        </button>
        <button
          onClick={() => setFilterType('new')}
          className={`px-3 py-1.5 rounded-lg flex-1 ${
            filterType === 'new'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          New Filter
          <div className="text-xs">
            {filterType === 'new' && '(With unit restrictions)'}
          </div>
        </button>
      </div>
    </div>
  );

  const toggleProblemUsed = (problem) => {
    const newMap = new Map(usedProblemMap);
    if (newMap.has(problem.id)) {
      newMap.delete(problem.id);
    } else {
      newMap.set(problem.id, problem);
    }
    setUsedProblemMap(newMap);
  };

  const toggleCompanionUsed = (problem) => {
    const newMap = new Map(companionUsedProblemMap);
    if (newMap.has(problem.id)) {
      newMap.delete(problem.id);
    } else {
      newMap.set(problem.id, true);
    }
    setCompanionUsedProblemMap(newMap);
  };

  const ProblemCard = ({ problem, isUsed, isCompanionUsed }) => (
    <div className={`p-2 rounded border ${
      isUsed ? 'bg-red-100' : 
      isCompanionUsed ? 'bg-yellow-100' : 
      'bg-white'
    }`}>
      <div className="text-sm font-bold">ID: {problem.id}</div>
      <div className="text-sm">Unit: {problem.unitId}</div>
      <div className="mt-1 space-x-1 flex text-sm">
        <button
          onClick={() => toggleProblemUsed(problem)}
          className={`px-2 py-0.5 rounded flex items-center ${
            isUsed 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <span>Used</span>
          <span className="text-xs ml-1">(현재)</span>
        </button>
        <button
          onClick={() => toggleCompanionUsed(problem)}
          className={`px-2 py-0.5 rounded flex items-center ${
            isCompanionUsed 
              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <span>Companion</span>
          <span className="text-xs ml-1">(히스토리)</span>
        </button>
      </div>
    </div>
  );

  const getProblemStatus = (problemId) => {
    if (!primaryResult) return "unselected";
    
    const isSelected = primaryResult.randomizedProblems.some(
      p => p.id === problemId
    );
    return isSelected ? "selected" : "unselected";
  };


  const ResultSection = ({ title, problems }) => (
    <div className="border rounded-lg p-2">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {problems.map(problem => (
          <div 
            key={problem.id} 
            className={`p-2 rounded border ${
              getProblemStatus(problem.id) === "selected" 
                ? "bg-green-100" 
                : "bg-gray-100"
            }`}
          >
            <div className="text-sm font-bold">ID: {problem.id}</div>
            <div className="text-sm">Unit: {problem.unitId}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-2">Problem Filter Visualizer</h1>
      
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left Column */}
        <div className="flex flex-col gap-4 overflow-auto">
          <FilterTypeToggle />
          
          <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Published Problems by Unit</h2>
            <div className="space-y-2">
              {publishedProblems.map((unitProblems, unitIndex) => (
                <div key={unitIndex} className="border rounded-lg p-2">
                  <h3 className="font-semibold mb-1">Unit Group {unitIndex + 1}</h3>
                  <div className="flex flex-wrap gap-2">
                    {unitProblems.map(problem => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        isUsed={usedProblemMap.has(problem.id)}
                        isCompanionUsed={companionUsedProblemMap.has(problem.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="flex flex-col gap-4 overflow-auto">
          {primaryResult && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Primary Results
                  <span className="text-sm font-normal ml-2">
                    ({filterType === 'basic' ? 'No' : 'With'} unit restrictions)
                  </span>
                </h2>
                <div className="space-y-2">
                  <ResultSection 
                    title="Selected" 
                    problems={primaryResult.randomizedProblems}
                  />
                  <ResultSection 
                    title="Unselected" 
                    problems={primaryResult.unchosenProblems}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Lesson Results
                  <span className="text-sm font-normal ml-2">
                    (Limit: {context.perGroupLimit})
                  </span>
                </h2>
                {lessonResult && (
                  <ResultSection 
                    title="Problems" 
                    problems={lessonResult}
                  />
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Secondary Results
                  <span className="text-sm font-normal ml-2">
                    (Limit: {context.perGroupLimit})
                  </span>
                </h2>
                {secondaryResult && (
                  <ResultSection 
                    title="Problems" 
                    problems={secondaryResult}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}